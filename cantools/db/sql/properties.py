import sqlalchemy

def _col(colClass, *args, **kwargs):
	cargs = {}
	if "primary_key" in kwargs:
		cargs["primary_key"] = kwargs.pop("primary_key")
#	print args, kwargs, cargs
	return sqlalchemy.Column(colClass(**kwargs), *args, **cargs)

def sqlColumn(colClass):
	class WrappedProperty(colClass):
		def __init__(self, *args, **kwargs):
			if "default" in kwargs:
				kwargs.pop("default") # actually, set value to kwargs.pop("default")
			colClass.__init__(self, *args, **kwargs)
	return lambda *args, **kwargs : _col(WrappedProperty, *args, **kwargs)

for prop in ["Integer", "Float", "Boolean", "String", "Text", "Binary", "Date", "Time", "ForeignKey"]:
	sqlprop = getattr(sqlalchemy, prop)
	globals()["sql%s"%(prop,)] = sqlprop
	globals()[prop] = sqlColumn(sqlprop)

class DateTimeColumn(sqlalchemy.DateTime):
	def __init__(self, *args, **kwargs): # do something with auto_now, auto_now_add
		self.auto_add = "auto_add" in kwargs and kwargs.pop("auto_add") or False
		self.auto_now_add = "auto_now_add" in kwargs and kwargs.pop("auto_now_add") or False
		sqlalchemy.DateTime.__init__(self, *args, **kwargs)

DateTime = sqlColumn(DateTimeColumn)