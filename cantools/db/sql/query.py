from sqlalchemy.sql import func
from cantools.util import start_timer, end_timer
from properties import *
from getters import *
from setters import *
from session import session, testSession, metadata, Session

_passthru = ["count", "all"]
_qmod = ["filter", "limit", "offset", "join"]

class Query(object):
    def __init__(self, mod, *args, **kwargs):
        self.mod = mod
        self.schema = get_schema(mod)
        self.session = kwargs.pop("session", session)
        self.query = self.session.query(mod)
        for fname in _passthru:
            setattr(self, fname, self._qpass(fname))
        for fname in _qmod:
            setattr(self, fname, self._qmlam(fname))
        self.get = self._qpass("first")
        self._order = self._qmlam("order_by")
        self.filter(*args, **kwargs)

    def order(self, prop):
        if isinstance(prop, basestring) and "." in prop: # it's a foreignkey reference from another table
            from lookup import refcount_subq
            asc = True
            if prop.startswith("-"):
                asc = False
                prop = prop[1:]
            sub = refcount_subq(prop, self.session)
            order = sub.c.count
            if not asc:
                order = -sub.c.count
            return self.join(sub, self.mod.key == sub.c.target).order(order)
        return self._order(prop)

    def _qpass(self, fname):
        def qp(*args, **kwargs):
            qkey = "Query.%s: %s %s (%s)"%(fname, args, kwargs, self.query)
            start_timer(qkey)
            res = getattr(self.query, fname)(*args, **kwargs)
            end_timer(qkey)
            return res
        return qp

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