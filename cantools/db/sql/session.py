import threading
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker
from fyg.util import confirm
from rel import tick
from cantools import config
from cantools.util import log, error
from cantools.web import cgi_dump, set_pre_close

dcfg = config.db
pcfg = dcfg.pool
metadata = MetaData()

def conn_ex(cmd):
    log("issuing command: %s"%(cmd,), important=True)
    with session.engine.connect() as conn:
        conn.execute(text(cmd))

def add_column(mod, col): # sqlite only
    log("adding '%s' to '%s'"%(col, mod))
    conn_ex('ALTER TABLE "%s" ADD COLUMN "%s"'%(mod, col))

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
            if config.db.alter == "auto" or confirm("Add missing column '%s' to table '%s' (sqlite-only!)"%(tcol, tmod), True):
                log("rolling back session")
                session.rollback()
                raise_anyway = False
                add_column(tmod, tcol)
        else:
            log("To auto-update columns, add 'DB_ALTER = True' to your ct.cfg (sqlite only!)", important=True)
    if raise_anyway:
        error(e)

def threadname():
	return threading.currentThread().getName()

class Basic(object): # move elsewhere?
	def sig(self):
		return "%s(%s)"%(self.__class__.__name__, self.id)

	def log(self, *msg):
		if "db" in config.log.allow:
			log("[db] session | %s :: %s"%(self.sig(), " ".join(msg)))

class Session(Basic):
	def __init__(self, database):
		Session._id += 1
		self.id = Session._id
		self.database = database
		self.engine = database.engine
		self.generator = scoped_session(sessionmaker(bind=self.engine), scopefunc=self._scope)
		for fname in ["add", "add_all", "delete", "flush", "commit", "query", "rollback"]:
			setattr(self, fname, self._func(fname))
		self._refresh()
		self.log("initialized")

	def teardown(self):
		self.engine = None
		self.session = None
		self.database = None
		self.generator = None

	def _scope(self):
		threadId = threadname()
		if threadId == "MainThread":
			threadId = tick()
		return "%s%s"%(threadId, cgi_dump())

	def _func(self, fname):
		def f(*args):
			self._refresh()
			self.database.init()
			return getattr(self.session, fname)(*args)
		return f

	def _refresh(self):
		self.session = self.generator()
		self.no_autoflush = self.session.no_autoflush

class DataBase(Basic):
	def __init__(self, db=dcfg.main):
		DataBase._id += 1
		self.id = DataBase._id
		if pcfg.null:
			self.engine = create_engine(db, poolclass=NullPool, echo=dcfg.echo)
		else:
			self.engine = create_engine(db, pool_size=pcfg.size,
				max_overflow=pcfg.overflow, pool_recycle=pcfg.recycle, echo=dcfg.echo)
		self.sessions = {}
		self._ready = False
		self.log("initialized")

	def init(self):
		if not self._ready:
			self._ready = True
			metadata.create_all(self.engine)

	def session(self):
		thread = threadname()
		if thread not in self.sessions:
			self.sessions[thread] = Session(self)
			self.log("session(%s) created!"%(thread,))
		return self.sessions[thread]

	def close(self):
		thread = threadname()
		if thread in self.sessions:
			self.sessions[thread].generator.remove()
			if thread == "MainThread":
				note = "released"
			else:
				self.sessions[thread].teardown()
				del self.sessions[thread]
				note = "deleted"
		else:
			note = "not found!"
		self.log("close(%s)"%(thread,), "session", note)

class SessionManager(Basic):
	def __init__(self):
		SessionManager._id += 1
		self.id = SessionManager._id
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

Session._id = DataBase._id = SessionManager._id = 0

def testSession():
	return seshman.get(dcfg.test)

seshman = SessionManager()
session = seshman.get()
set_pre_close(seshman.close)