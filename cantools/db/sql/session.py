import threading
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from cantools import config
from cantools.util import log
from cantools.web import cgi_dump, set_pre_close

lastSession = None

class Session(object):
	def __init__(self, dbstring=config.db):
		self.engine = create_engine(dbstring, pool_recycle=7200, echo=config.db_echo)
		self.generator = scoped_session(sessionmaker(bind=self.engine), scopefunc=self._scope)
		for fname in ["add", "add_all", "delete", "flush", "commit", "query"]:
			setattr(self, fname, self._func(fname))
		self._refresh()

	def _scope(self):
		return "%s%s"%(threading.currentThread().getName(), cgi_dump())

	def _func(self, fname):
		def f(*args):
			self._refresh()
			func = getattr(self.session, fname)
			try:
				res = func(*args)
			except Exception, e:
				log("session.%s failed -- rebuilding session: %s"%(fname, e), important=True)
				self.generator.remove()
				self._refresh()
				res = func(*args)
			return res
		return f

	def _refresh(self):
		global lastSession
		lastSession = self
		self.session = self.generator()
		self.no_autoflush = self.session.no_autoflush

def loadTables(cls):
	cls.metadata.create_all(lastSession.engine)

def testSession():
	return Session(config.db_test)

def closeSession():
	lastSession.generator.remove()

set_pre_close(closeSession)

session = Session()