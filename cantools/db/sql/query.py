import base64, json
from datetime import datetime
from properties import *
import session as seshmod
session = seshmod.session
testSession = seshmod.testSession

def init_multi(instances, session=session):
	now = datetime.now()
	for instance in instances:
		for key, val in instance.__class__.__dict__.items():
			if getattr(val, "is_dt_autostamper", False) and val.should_stamp(not instance.index):
				setattr(instance, key, now)
	session.add_all(instances)
	session.flush()
	for instance in instances:
		instance.key = instance.key or Key(b64encode(json.dumps({
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

_passthru = ["count", "all"]
_qmod = ["filter", "limit", "offset"]

class Query(object):
	def __init__(self, mod, *args, **kwargs):
		self.query = kwargs.pop("session", session).query(mod)
		for fname in _passthru:
			setattr(self, fname, self._qplam(fname))
		for fname in _qmod:
			setattr(self, fname, self._qmlam(fname))
		setattr(self, "order", self._qmlam("order_by"))
		self.get = self.query.first
		self.filter(*args, **kwargs)

	def _qplam(self, fname):
		return lambda *a, **k : getattr(self.query, fname)(*a, **k)

	def _qmlam(self, fname):
		return lambda *a, **k : self._qmod(fname, *a, **k)

	def _qmod(self, modname, *args, **kwargs):
		self.query = getattr(self.query, modname)(*args, **kwargs)
		return self

	def fetch(self, limit, offset=0, keys_only=False):
		self.limit(limit)
		if offset:
			self.offset(offset)
		res = self.all()
		if keys_only: # best way?
			return [r.key for r in res]
		return res