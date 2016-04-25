import threading
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker
from rel import tick
from cantools import config
from cantools.util import log
from cantools.web import cgi_dump, set_pre_close

metadata = MetaData()
lastSession = None

class Session(object):
	def __init__(self, dbstring=config.db.main):
		self.engine = create_engine(dbstring, pool_recycle=7200, echo=config.db.echo)
		self.generator = scoped_session(sessionmaker(bind=self.engine), scopefunc=self._scope)
		for fname in ["add", "add_all", "delete", "flush", "commit", "query"]:
			setattr(self, fname, self._func(fname))
		self._initialized_tables = False
		self._refresh()

	def init(self):
		if not self._initialized_tables:
			metadata.create_all(self.engine)
			self._initialized_tables = True

	def _scope(self):
		threadId = threading.currentThread().getName()
		if threadId == "MainThread":
			threadId = tick()
		return "%s%s"%(threadId, cgi_dump())

	def _func(self, fname):
		def f(*args):
			self._refresh()
			self.init()
			return getattr(self.session, fname)(*args)
		return f

	def _refresh(self):
		global lastSession
		lastSession = self
		self.session = self.generator()
		self.no_autoflush = self.session.no_autoflush

def testSession():
	return Session(config.db.test)

def closeSession():
	lastSession.generator.remove()

set_pre_close(closeSession)

session = Session()