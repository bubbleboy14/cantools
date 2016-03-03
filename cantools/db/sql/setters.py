import base64, json
from datetime import datetime
from properties import KeyWrapper
from session import session, loadTables

def init_multi(instances, session=session):
	now = datetime.now()
	classes = set()
	for instance in instances:
		cls = instance.__class__
		if cls not in classes:
			classes.add(cls)
			loadTables(cls)
		for key, val in cls.__dict__.items():
			if getattr(val, "is_dt_autostamper", False) and val.should_stamp(not instance.index):
				setattr(instance, key, now)
	session.add_all(instances)
	session.flush()
	for instance in instances:
		instance.key = instance.key or KeyWrapper(base64.b64encode(json.dumps({
			"index": instance.index,
			"model": instance.polytype
		})))

def put_multi(instances, session=session):
	i = 0
	while i < len(instances):
		init_multi(instances[i:i+1000], session)
		i += 1000
	session.commit()

def delete_multi(instances, session=session):
	for instance in instances:
		instance.rm(False)
	session.commit()

def edit(data, session=session):
	from cantools.db import get, get_model
	ent = "key" in data and get(data["key"], session) or get_model(data["modelName"])()
	for propname, proptype in ent._schema.items():
		if propname in data: # check proptype....
			setattr(ent, propname, data[propname])
	ent.put()
	return ent