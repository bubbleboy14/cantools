import sqlalchemy

for prop in ["Integer", "Float", "Boolean", "String", "Text", "Binary", "Date", "Time", "DateTime", "ForeignKey"]:
	globals()[prop] = lambda *args, **kwargs : sqlalchemy.Column(getattr(sqlalchemy, prop), *args, **kwargs)