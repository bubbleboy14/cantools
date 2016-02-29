from properties import *
from getters import *
from setters import *
from session import session, testSession, loadTables

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
		self.filter(*args, **kwargs)

	def _qplam(self, fname):
		return lambda *a, **k : getattr(self.query, fname)(*a, **k)

	def _qmlam(self, fname):
		return lambda *a, **k : self._qmod(fname, *a, **k)

	def _qmod(self, modname, *args, **kwargs):
		self.query = getattr(self.query, modname)(*args, **kwargs)
		return self

	def get(self):
		return self.query.first()

	def fetch(self, limit, offset=0, keys_only=False):
		self.limit(limit)
		if offset:
			self.offset(offset)
		res = self.all()
		if keys_only: # best way?
			return [r.key for r in res]
		return res