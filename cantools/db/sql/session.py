import threading
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker
from rel import tick
from cantools import config
from cantools.util import log, error
from cantools.web import cgi_dump, set_pre_close

dcfg = config.db
metadata = MetaData()

def handle_error(e, session=None, polytype=None, flag=" no such column: "):
    log("Database operation failed: %s"%(e,), important=True)
    session = session or seshman.get()
    raise_anyway = True
    stre = str(e)
    if flag in stre:
        target = stre.split(flag)[1].split(None, 1)[0]
        log("Missing column: %s"%(target,), important=True)
        if config.db.alter:
            if "." in target:
                tmod, tcol = target.split(".")
            else:
                tcol = target
                tmod = polytype
            if config.db.alter == "auto" or not input("Add missing column '%s' to table '%s' (sqlite-only!)? [Y/n] "%(tcol, tmod)).lower().startswith("n"):
                raise_anyway = False
                log("adding '%s' to '%s'"%(tcol, tmod))
                with session.engine.connect() as conn:
                    result = conn.execute(text("ALTER TABLE %s ADD COLUMN %s"%(tmod, tcol)))
        else:
            log("To auto-update columns, add 'DB_ALTER = True' to your ct.cfg (sqlite only!)", important=True)
    if raise_anyway:
        error(e)

def threadname():
	return threading.currentThread().getName()

class Basic(object): # move elsewhere?
	def sig(self):
		return self.__class__.__name__

	def log(self, *msg):
		if "db" in config.log.allow:
			log("[db] session | %s :: %s"%(self.sig(), " ".join(msg)))

class Session(Basic):
	def __init__(self, engine):
		Session._id += 1
		self.id = Session._id
		self.generator = scoped_session(sessionmaker(bind=engine), scopefunc=self._scope)
		for fname in ["add", "add_all", "delete", "flush", "commit", "query"]:
			setattr(self, fname, self._func(fname))
		self._refresh()
		self.log("initialized")

	def sig(self):
		return "Session(%s)"%(self.id,)

	def _scope(self):
		threadId = threadname()
		if threadId == "MainThread":
			threadId = tick()
		return "%s%s"%(threadId, cgi_dump())

	def _func(self, fname):
		def f(*args):
			self._refresh()
			return getattr(self.session, fname)(*args)
		return f

	def _refresh(self):
		self.session = self.generator()
		self.no_autoflush = self.session.no_autoflush

Session._id = 0

class DataBase(Basic):
	def __init__(self, db=dcfg.main):
		self.engine = create_engine(db, pool_recycle=7200, echo=dcfg.echo)
		metadata.create_all(self.engine)
		self.sessions = {}
		self.log("initialized")

	def session(self):
		thread = threadname()
		if thread not in self.sessions:
			self.sessions[thread] = Session(self.engine)
			self.log("session(%s) created!"%(thread,))
		return self.sessions[thread]

	def close(self):
		thread = threadname()
		if thread in self.sessions:
			self.sessions[thread].generator.remove()
			if thread == "MainThread":
				note = "ended"
			else:
				del self.sessions[thread]
				note = "deleted"
		else:
			note = "not found!"
		self.log("close(%s)"%(thread,), "session", note)

class SessionManager(Basic):
	def __init__(self):
		self.dbs = {}
		self.log("initialized")

	def db(self, db=dcfg.main):
		if db not in self.dbs:
			self.dbs[db] = DataBase(db)
		return self.dbs[db]

	def get(self, db=dcfg.main):
		return self.db(db).session()

	def close(self, db=dcfg.main):
		self.db(db).close()

def testSession():
	return seshman.get(dcfg.test)

seshman = SessionManager()
session = seshman.get()
set_pre_close(seshman.close)