import threading
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker
from rel import tick
from cantools import config
from cantools.util import log
from cantools.web import cgi_dump, set_pre_close

dcfg = config.db
metadata = MetaData()

def threadname():
	return threading.currentThread().getName()

class Basic(object): # move elsewhere?
	def sig(self):
		return self.__class__.__name__

	def log(self, *msg):
		if "query" in config.log.allow:
			log("%s :: %s"%(self.sig(), " ".join(msg)))

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
			self.log("session created for", thread)
		return self.sessions[thread]

	def close(self):
		thread = threadname()
		self.sessions[thread].generator.remove()
		if thread != "MainThread":
			del self.sessions[thread]
		self.log("session closed for", thread)

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