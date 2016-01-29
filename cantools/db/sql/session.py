from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from cantools import config
from cantools.util import log
from cantools.web import cgi_dump, set_pre_close

engine = create_engine(config.db, pool_recycle=7200)

class Session(object):
	def __init__(self):
		self.generator = scoped_session(sessionmaker(bind=engine), scopefunc=cgi_dump)
		set_pre_close(self.generator.remove)
		for fname in ["add", "add_all", "delete", "flush", "commit", "query"]:
			setattr(self, fname, self._func(fname))

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
		self.session = self.generator()

session = Session()