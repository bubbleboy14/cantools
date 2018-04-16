import os, json, sqlalchemy

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
		isKey = kwargs["isKey"] = colClass is Key
		typeInstance = ArrayType(**kwargs)
		col = sqlalchemy.Column(typeInstance, *args, **cargs)
		col._ct_type = isKey and "keylist" or "list"
		if isKey:
			col._kinds = typeInstance.kinds
		return col
	typeInstance = colClass(**kwargs)
	col = sqlalchemy.Column(typeInstance, *args, **cargs)
	if hasattr(typeInstance, "choices"):
		col.choices = typeInstance.choices
	if colClass is DateTimeAutoStamper:
		col.is_dt_autostamper = True
		col.should_stamp = typeInstance.should_stamp
		col._ct_type = "datetime"
	elif colClass is BasicString:
		col._ct_type = "string"
	elif colClass is Key:
		col._kinds = typeInstance.kinds
	if not hasattr(col, "_ct_type"):
		col._ct_type = colClass.__name__.lower()
	col._default = default
	return col

def sqlColumn(colClass):
	return lambda *args, **kwargs : _col(colClass, *args, **kwargs)

for prop in ["Integer", "Float", "Boolean", "Text", "Date", "Time"]:
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
class BasicString(basicType(sqlalchemy.UnicodeText, StringType)):
	def process_bind_param(self, data, dialect):
		if data and type(data) is not unicode:
			data = data.decode('utf-8')
		return data

String = sqlColumn(BasicString)

class BlobWrapper(object):
	def __init__(self, data="", value=0):
		self.value = value
		if data:
			self.set(data)
		else:
			self._set_path(value)

	def __nonzero__(self):
		return bool(self.value)

	def get(self):
		if self.value:
			from cantools.util import read
			return read(self.path, binary=True)
		else:
			return None

	def _set_path(self, data=None):
		if data:
			from cantools import config
			if not self.value:
				p, d, f = os.walk(config.db.blob).next()
				self.value = len(f) + 1
			self.path = os.path.join(config.db.blob, str(self.value))
		else:
			self.value = 0
			self.path = None

	def set(self, data):
		self._set_path(data)
		if data:
			from cantools.util import write
			write(data, self.path, binary=True)

	def delete(self):
		if self.value:
			from cantools.util import rm
			rm(self.path)
			self._set_path()

	def urlsafe(self):
		return self.path and "/" + "/".join(os.path.split(self.path))

class Blob(basicType(sqlInteger)):
	def process_bind_param(self, data, dialect):
		if type(data) is not BlobWrapper:
			data = BlobWrapper(data)
		return data.value

	def process_result_value(self, value, dialect):
		return BlobWrapper(value=value)

Binary = sqlColumn(Blob)

"""
class Binary(basicType(sqlString)):
	def process_bind_param(self, value, dialect):
		return sqlalchemy.func.HEX(value)

	def process_result_value(self, value, dialect):
		return sqlalchemy.func.UNHEX(value)
"""

class ArrayType(BasicString):
	def __init__(self, *args, **kwargs):
		self.isKey = kwargs.pop("isKey", False)
		if self.isKey:
			self.kinds = kwargs.pop("kinds", [kwargs.pop("kind", "*")])
			for i in range(len(self.kinds)):
				if not isinstance(self.kinds[i], basestring):
					self.kinds[i] = self.kinds[i].__name__.lower()
		BasicString.__init__(self, *args, **kwargs)

	def process_bind_param(self, value, dialect):
		if self.isKey:
			for i in range(len(value)):
				if hasattr(value[i], "urlsafe"):
					value[i] = value[i].urlsafe()
		return json.dumps(value)

	def process_result_value(self, value, dialect):
		try:
			vlist = json.loads(value) or []
		except:
			vlist = []
		if self.isKey:
			for i in range(len(vlist)):
				vlist[i] = KeyWrapper(vlist[i])
		return vlist

class KeyWrapper(object):
	def __init__(self, urlsafe=None):
		self.value = urlsafe

	def __nonzero__(self):
		return bool(self.value)

	def __eq__(self, other):
		return hasattr(other, "value") and self.value == other.value

	def __ne__(self, other):
		return not hasattr(other, "value") or self.value != other.value

	def get(self, session=None):
		from cantools.db import get
		if not session:
			from cantools.db import session
		return get(self.value, session)

	def delete(self):
		ent = self.get()
		ent and ent.rm() # should be more efficient way...

	def urlsafe(self):
		return self.value

class Key(BasicString):
	def __init__(self, *args, **kwargs):
		self.kinds = kwargs.pop("kinds", [kwargs.pop("kind", "*")])
		for i in range(len(self.kinds)):
			if not isinstance(self.kinds[i], basestring):
				self.kinds[i] = self.kinds[i].__name__.lower()
		BasicString.__init__(self, *args, **kwargs)

	def process_bind_param(self, value, dialect):
		while True:#value and hasattr(value, "urlsafe"):
			try: # for sqlite weirdness -- do this cleaner?
				value = value.urlsafe()
			except:
				break
		return value

	def process_result_value(self, value, dialect):
		return KeyWrapper(value)

CompositeKey = sqlColumn(Key)
ForeignKey = sqlColumn(Key)

def sqlForeignKey(targetClass, **kwargs):
	return sqlalchemy.Column(sqlInteger,
		sqlalchemy.ForeignKey("%s.index"%(targetClass.__tablename__,)), **kwargs)