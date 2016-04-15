import sqlalchemy

class DynamicType(sqlalchemy.TypeDecorator):
	def __init__(self, *args, **kwargs):
		self.choices = kwargs.pop("choices", None)
		sqlalchemy.TypeDecorator.__init__(self, *args, **kwargs)

class StringType(DynamicType):
	def __init__(self, *args, **kwargs):
		# '500' (len) required for MySQL VARCHAR
		DynamicType.__init__(self, 500, *args, **kwargs)

def basicType(colClass, baseType=DynamicType):
	return type("%s"%(colClass.__name__,), (baseType,), { "impl": colClass })

def _col(colClass, *args, **kwargs):
	cargs = {}
	if "primary_key" in kwargs:
		cargs["primary_key"] = kwargs.pop("primary_key")
	default = kwargs.pop("default", None)

	if kwargs.pop("repeated", None):
		return sqlalchemy.Column(ArrayType(**kwargs), *args, **cargs)
	typeInstance = colClass(**kwargs)
	col = sqlalchemy.Column(typeInstance, *args, **cargs)
	if hasattr(typeInstance, "choices"):
		col.choices = typeInstance.choices
	if colClass is DateTimeAutoStamper:
		col.is_dt_autostamper = True
		col.should_stamp = typeInstance.should_stamp
	if colClass is Key:
		col._kinds = typeInstance.kinds
	col._ct_type = colClass.__name__.lower()
	col._default = default
	return col

def sqlColumn(colClass):
	return lambda *args, **kwargs : _col(colClass, *args, **kwargs)

for prop in ["Integer", "Float", "Boolean", "Text", "Binary", "Date", "Time"]:
	sqlprop = getattr(sqlalchemy, prop)
	globals()["sql%s"%(prop,)] = sqlprop
	globals()[prop] = sqlColumn(basicType(sqlprop))

# datetime
BasicDT = basicType(sqlalchemy.DateTime)
class DateTimeAutoStamper(BasicDT):
	def __init__(self, *args, **kwargs):
		self.auto_now = kwargs.pop("auto_now", False)
		self.auto_now_add = kwargs.pop("auto_now_add", False)
		BasicDT.__init__(self, *args, **kwargs)

	def should_stamp(self, is_new):
		return self.auto_now or is_new and self.auto_now_add

DateTime = sqlColumn(DateTimeAutoStamper)

# strings, arrays, keys
sqlString = sqlalchemy.String
BasicString = basicType(sqlString, StringType)
String = sqlColumn(BasicString)

class ArrayType(BasicString):
	def process_bind_param(self, value, dialect):
		return json.dumps(value)

	def process_result_value(self, value, dialect):
		return json.loads(value)

class KeyWrapper(object):
	def __init__(self, urlsafe=None):
		self.value = urlsafe

	def __nonzero__(self):
		return bool(self.value)

	def get(self, session=None):
		from cantools.db import get
		if not session:
			from cantools.db import session
		return get(self.value, session)

	def delete(self):
		self.get().rm() # should be more efficient way...

	def urlsafe(self):
		return self.value

class Key(BasicString):
	def __init__(self, *args, **kwargs):
		self.kinds = kwargs.pop("kinds", [kwargs.pop("kind", "*")])
		BasicString.__init__(self, *args, **kwargs)

	def process_bind_param(self, value, dialect):
		return value and value.urlsafe()

	def process_result_value(self, value, dialect):
		return KeyWrapper(value)

CompositeKey = sqlColumn(Key)
ForeignKey = sqlColumn(Key)

def sqlForeignKey(targetClass, **kwargs):
	return sqlalchemy.Column(sqlInteger,
		sqlalchemy.ForeignKey("%s.index"%(targetClass.__tablename__,)), **kwargs)