import json, sqlalchemy

_cparams = ["primary_key", "default"]

def _col(colClass, *args, **kwargs):
	cargs = {}
	for p in _cparams:
		if p in kwargs:
			cargs[p] = kwargs.pop(p)
#	print args, kwargs, cargs
	if kwargs.pop("repeated", None):
		return sqlalchemy.Column(ArrayType(**kwargs), *args, **cargs)
	typeInstance = colClass(**kwargs)
	col = sqlalchemy.Column(typeInstance, *args, **cargs)
	if colClass is DateTimeAutoStamper:
		col.is_dt_autostamper = True
		col.should_stamp = typeInstance.should_stamp
	return col

def sqlColumn(colClass):
	return lambda *args, **kwargs : _col(colClass, *args, **kwargs)

for prop in ["Integer", "Float", "Boolean", "String", "Text", "Binary", "Date", "Time"]:
	sqlprop = getattr(sqlalchemy, prop)
	globals()["sql%s"%(prop,)] = sqlprop
	globals()[prop] = sqlColumn(sqlprop)

def ForeignKey(targetClass, **kwargs):
	return sqlalchemy.Column(sqlInteger,
		sqlalchemy.ForeignKey("%s.key"%(targetClass.__tablename__,)), **kwargs)

class DateTimeAutoStamper(sqlalchemy.DateTime):
	def __init__(self, *args, **kwargs):
		self.auto_now = kwargs.pop("auto_now", False)
		self.auto_now_add = kwargs.pop("auto_now_add", False)
		sqlalchemy.DateTime.__init__(self, *args, **kwargs)

	def should_stamp(self, is_new):
		return self.auto_now or is_new and self.auto_now_add

DateTime = sqlColumn(DateTimeAutoStamper)

class ArrayType(sqlalchemy.TypeDecorator):
	impl = sqlString

	def process_bind_param(self, value, dialect):
		return json.dumps(value)

	def process_result_value(self, value, dialect):
		return json.loads(value)

	def copy(self):
		return ArrayType(self.impl.length)