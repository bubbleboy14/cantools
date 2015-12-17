import sqlalchemy

def sqlColumn(colClass):
	return lambda *args, **kwargs : sqlalchemy.Column(colClass, *args, **kwargs)

for prop in ["Integer", "Float", "Boolean", "String", "Text", "Binary", "Date", "Time", "DateTime", "ForeignKey"]:
	globals()[prop] = sqlColumn(getattr(sqlalchemy, prop))