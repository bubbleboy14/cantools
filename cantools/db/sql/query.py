from sqlalchemy.sql import func, elements
from cantools.util import start_timer, end_timer, log, error
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
        self.query = kwargs.pop("query", self.session.query(mod))
        for fname in _passthru:
            setattr(self, fname, self._qpass(fname))
        for fname in _qmod:
            setattr(self, fname, self._qmlam(fname))
        self.get = self._qpass("first")
        self._order = self._qmlam("order_by")
        self.filter(*args, **kwargs)

    def order(self, prop):
        if type(prop) == elements.UnaryExpression:
            prop = "-%s"%(prop.element.description,)
        if isinstance(prop, basestring):
            asc = False
            if prop.startswith("-"):
                prop = prop[1:]
            else:
                asc = True
            if "." in prop: # foreignkey reference from another table
                from lookup import refcount_subq
                sub = refcount_subq(prop, self.session)
                order = sub.c.count
                if not asc:
                    order = -sub.c.count
                return self.join(sub, self.mod.key == sub.c.target).order(order)
            prop = getattr(self.mod, prop)
            if not asc:
                prop = prop.desc()
        return self._order(prop)

    def _qpass(self, fname):
        def qp(*args, **kwargs):
            from cantools import config
            qkey = "Query.%s: %s %s (%s)"%(fname, args, kwargs, self.query)
            if "query" in config.log.allow:
                start_timer(qkey)
            try:
                res = getattr(self.query, fname)(*args, **kwargs)
            except Exception, e:
                log("Query operation failed: %s"%(e,), important=True)
                raise_anyway = True
                flag = " no such column: "
                stre = str(e)
                if flag in stre:
                    target = stre.split(flag)[1].split(" ", 1)[0]
                    log("Missing column: %s"%(target,), important=True)
                    if config.db.alter:
                        tmod, tcol = target.split(".")
                        if not raw_input("Add missing column '%s' to table '%s' (sqlite-only!)? [Y/n] "%(tcol, tmod)).lower().startswith("n"):
                            raise_anyway = False
                            log("adding '%s' to '%s'"%(tcol, tmod))
                            self.session.engine.execute("ALTER TABLE %s ADD COLUMN %s"%(tmod, tcol))
                            log("retrying query operation")
                            res = getattr(self.query, fname)(*args, **kwargs)
                    else:
                        log("To auto-update columns, add 'DB_ALTER = True' to your ct.cfg (sqlite only!)", important=True)
                if raise_anyway:
                    error(e)
            if "query" in config.log.allow:
                end_timer(qkey)
            return res
        return qp

    def _qmlam(self, fname):
        return lambda *a, **k : self._qmod(fname, *a, **k)

    def _qmod(self, modname, *args, **kwargs):
        self.query = getattr(self.query, modname)(*args, **kwargs)
        return self

    def copy(self, *args, **kwargs):
        kwargs["query"] = self.query
        return Query(self.mod, *args, **kwargs)

    def fetch(self, limit=None, offset=0, keys_only=False):
        if limit:
            self.limit(limit)
        if offset:
            self.offset(offset)
        res = self.all()
        if keys_only: # best way?
            return [r.key for r in res]
        return res