import sys, platform
from dez.network import SocketController, daemon_wrapper
from dez.http.server.shield import Shield
from dez.logging import get_logger_getter
from cantools import config
from .daemons import Web, Admin
from .response import Response
from .cron import Cron
from cantools import config, __version__
from ..util import *
from ...util import read, write, log as syslog

logger_getter = get_logger_getter("httpd", syslog, config.log.allow)
CTR = None

class DController(SocketController):
	def __init__(self, *args, **kwargs):
		self.logger = logger_getter("Controller")
		SocketController.__init__(self, *args, **kwargs)
		self.handlers = {}
		self.logger.info("cantools: %s"%(__version__,))
		self.logger.info("Python: %s"%(sys.version.split(' ')[0],))
		self.logger.info("System: " + " > ".join([part for part in platform.uname() if part]))

	def _respond(self, resp, *args, **kwargs):
		if resp: # regular request
			kwargs["response"] = resp
			localvars.response = resp
		else: # cron
			kwargs["noLoad"] = True
			kwargs["threaded"] = True
		do_respond(*args, **kwargs)

	def register_handler(self, args, kwargs):
		self.logger.info("register handler: %s"%(self.curpath,))
		self.handlers[self.curpath] = lambda resp : self._respond(resp, *args, **kwargs)

	def trigger_handler(self, rule, target, req=None):
		self.curpath = rule
		if rule not in self.handlers:
			self.logger.info("importing module: %s"%(target,))
			__import__(target)
		self.handlers[rule](req and Response(req))

	def paperShield(self, path, ip, fspath=False, count=True):
		self.logger.access('NOOP > paperShield("%s", "%s", fspath=%s, count=%s)'%(path, ip, fspath, count))

	def blup(self):
		bl = list(config.web.blacklist)
		self.logger.info("saving %s IPs in black.list"%(len(bl),))
		write("\n".join(bl), "black.list")

def getController():
	global CTR
	if not CTR:
		# controller
		CTR = DController()

		shield = None
		if config.web.shield: # web/admin share shield and blacklist
			bl = read("black.list")
			if bl:
				config.web.blacklist += bl.split("\n")
			config.web.update("blacklist", set(config.web.blacklist))
			shield = Shield(config.web.blacklist, logger_getter, CTR.blup)
		localvars.shield = shield or CTR.paperShield

		# web
		CTR.web = CTR.register_address(config.web.host,
			config.web.port, dclass=daemon_wrapper(Web, logger_getter, shield))
		CTR.web.controller = CTR

		# admin
		config.admin.update("pw",
			config.cache("admin password? ", overwrite=config.newpass))
		CTR.admin = CTR.register_address(config.admin.host,
			config.admin.port, dclass=daemon_wrapper(Admin, logger_getter, shield))
		CTR.admin.controller = CTR

		# cron
		Cron(CTR, logger_getter)

	return CTR