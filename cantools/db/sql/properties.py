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
	return sqlalchemy.Column(colClass(**kwargs), *args, **cargs)

def sqlColumn(colClass):
	return lambda *args, **kwargs : _col(colClass, *args, **kwargs)

for prop in ["Integer", "Float", "Boolean", "String", "Text", "Binary", "Date", "Time"]:
	sqlprop = getattr(sqlalchemy, prop)
	globals()["sql%s"%(prop,)] = sqlprop
	globals()[prop] = sqlColumn(sqlprop)

def ForeignKey(targetClass, **kwargs):
	return sqlalchemy.Column(sqlInteger,
		sqlalchemy.ForeignKey("%s.key"%(targetClass.__tablename__,)), **kwargs)

class DateTimeColumn(sqlalchemy.DateTime):
	def __init__(self, *args, **kwargs): # do something with auto_now, auto_now_add
		self.auto_add = "auto_add" in kwargs and kwargs.pop("auto_add") or False
		self.auto_now_add = "auto_now_add" in kwargs and kwargs.pop("auto_now_add") or False
		sqlalchemy.DateTime.__init__(self, *args, **kwargs)

DateTime = sqlColumn(DateTimeColumn)

class ArrayType(sqlalchemy.TypeDecorator):
	impl = sqlString

	def process_bind_param(self, value, dialect):
		return json.dumps(value)

	def process_result_value(self, value, dialect):
		return json.loads(value)

	def copy(self):
		return ArrayType(self.impl.length)