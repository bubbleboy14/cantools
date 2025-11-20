from ..config import config

# later, switch these imports on 'db' instead of 'web.server'
if config.web.server == "gae":
	from .gae.model import *
elif config.web.server == "dez":
	from rel import tick
	if not config.db.nopoly:
		from databae.poly import ModelBase, TimeStampedBase
	from databae import *
	from cantools.web import set_pre_close, cgi_dump
	def scoper(threadId):
		if threadId == "MainThread":
			threadId = tick()
		return "%s%s"%(threadId, cgi_dump())
	session = seshman.get()
	set_scoper(scoper)
	set_pre_close(seshman.close)
else:
	from fyg.util import error
	error("no data backend specified")