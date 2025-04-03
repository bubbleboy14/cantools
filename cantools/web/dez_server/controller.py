import os, sys, platform
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
		self.modules = {}
		self.blcount = 0
		self.blchunk = getattr(config.web.shield, "chunk", 5)
		self.logger.info("cantools: %s"%(__version__,))
		self.logger.info("Python: %s"%(sys.version.split(' ')[0],))
		self.logger.info("System: " + " > ".join([part for part in platform.uname() if part]))

	def _respond(self, resp, *args, **kwargs):
		if resp == "nothread": # "on start nothread" cron
			kwargs["noLoad"] = True
		elif resp: # regular request
			kwargs["response"] = resp
			localvars.response = resp
		else: # regular cron
			kwargs["noLoad"] = True
			kwargs["threaded"] = True
		do_respond(*args, **kwargs)

	def register_handler(self, args, kwargs):
		self.logger.info("register handler: %s"%(self.curpath,))
		self.handlers[self.curpath] = lambda resp : self._respond(resp, *args, **kwargs)

	def trigger_handler(self, rule, target, req=None, option=None):
		self.curpath = rule
		if rule not in self.handlers:
			if target in self.modules:
				self.logger.info("linking module: %s"%(target,))
				self.handlers[rule] = self.modules[target]
			else:
				self.logger.info("importing module: %s"%(target,))
				__import__(target)
				self.modules[target] = self.handlers[rule]
		self.handlers[rule](req and Response(req) or option)

	def blup(self):
		wcfg = config.web
		bl = wcfg.blacklist.obj()
		blen = len(bl.keys())
		self.logger.warn("saving %s IPs in black.list"%(blen,))
		write(bl, "black.list", isjson=True)
		if wcfg.report and self.blcount != blen:
			self.blcount = blen
			if not blen % self.blchunk:
				from cantools.web import email_admins
				email_admins("sketch IPs blacklisted", "sketch count: %s"%(blen,))
		wcfg.blacklister and wcfg.blacklister.update(bl)

class PaperShield(object):
	def __init__(self):
		self.logger = logger_getter("PaperShield")
		self.default = { "reason": "I'm just a paper shield!" }
		self.ips = {}

	def __call__(self, path, ip, fspath=False, count=True):
		self.logger.access('NOOP > paperShield("%s", "%s", fspath=%s, count=%s)'%(path, ip, fspath, count))

	def suss(self, ip, reason):
		self.logger.access("suss(%s) -> %s"%(ip, reason))
		self.ips[ip] = { "reason": reason }

	def ip(self, ip):
		return self.ips.get(ip, self.default)

def setBlacklist():
	bl = {}
	for preban in config.web.blacklist:
		bl[preban] = "config ban"
	if os.path.isfile("black.list"):
		try:
			bsaved = read("black.list", isjson=True)
		except: # old style
			bsaved = {}
			for line in read("black.list", lines=True):
				bsaved[line.strip()] = "legacy ban"
		bsaved and bl.update(bsaved)
	config.web.update("blacklist", bl)

def getController():
	global CTR
	if not CTR:
		# controller
		CTR = DController()

		shield = None
		shfg = config.web.shield
		if shfg: # web/admin share shield and blacklist
			setBlacklist()
			shield = Shield(config.web.blacklist, logger_getter, CTR.blup,
				getattr(shfg, "limit", 400),
				getattr(shfg, "interval", 2))
		config.web.update("shield", shield or PaperShield())
		mempad = config.mempad

		# web
		CTR.web = CTR.register_address(config.web.host,
			config.web.port, dclass=daemon_wrapper(Web, logger_getter, shield, mempad))
		CTR.web.controller = CTR

		# admin
		config.admin.update("pw",
			config.cache("admin password? ", overwrite=config.newpass))
		CTR.admin = CTR.register_address(config.admin.host,
			config.admin.port, dclass=daemon_wrapper(Admin, logger_getter, shield, mempad))
		CTR.admin.controller = CTR

		# cron
		Cron(CTR, logger_getter)

	return CTR