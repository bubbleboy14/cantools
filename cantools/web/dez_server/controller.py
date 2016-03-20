from dez.network import SocketController, daemon_wrapper
from dez.logging import get_logger_getter
from cantools import config
from daemons import Web, Admin
from response import Response
from cron import Cron
from cantools import config
from ..util import *
from ...util import log as syslog

logger_getter = get_logger_getter("httpd", syslog, config.log.allow)
CTR = None

class DController(SocketController):
	def __init__(self, *args, **kwargs):
		self.logger = logger_getter("Controller")
		SocketController.__init__(self, *args, **kwargs)
		self.handlers = {}

	def _respond(self, resp, *args, **kwargs):
		if resp: # regular request
			kwargs["response"] = resp
		else: # cron
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

def getController():
	global CTR
	if not CTR:
		# controller
		CTR = DController()

		# web
		CTR.web = CTR.register_address(config.web.host,
			config.web.port, dclass=daemon_wrapper(Web, logger_getter))
		CTR.web.controller = CTR

		# admin
		config.admin.update("pw", config.cache("admin password? "))
		CTR.admin = CTR.register_address(config.admin.host,
			config.admin.port, dclass=daemon_wrapper(Admin, logger_getter))
		CTR.admin.controller = CTR

		# cron
		Cron(CTR, logger_getter)

	return CTR