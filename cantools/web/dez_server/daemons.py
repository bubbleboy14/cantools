import sys
from rel import abort_branch, timeout
from dez.logging import get_logger_getter
from dez.memcache import get_memcache
from dez.http.server import HTTPResponse
from dez.http.application import HTTPApplication
from cantools import config
from routes import static, cb
from ..util import *
from ...util import log as syslog
sys.path.insert(0, ".") # for dynamically loading modules

logger_getter = get_logger_getter("dez", syslog, config.log.allow)
A_STATIC = { "/": "_", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" }
A_CB = { "/admin": "admin", "/_db": "_db" }

class Response(object):
	def __init__(self, request):
		self.id = request.id
		self.request = request
		self.response = HTTPResponse(request)

	def _read(self):
		return self.request.body or json.dumps(rb64(self.request.qs_params))

	def _send(self, *args, **kwargs):
		self.response.write(*args, **kwargs)

	def _close(self):
		timeout(.001, self.response.dispatch)
		abort_branch()

	def _header(self, *args, **kwargs):
		self.response.__setitem__(*args, **kwargs)

	def set_cbs(self):
		set_read(self._read)
		set_header(self._header)
		set_send(self._send)
		set_close(self._close)

class CTWebBase(HTTPApplication):
	def __init__(self, bind_address, port, static=static, cb=cb):
		HTTPApplication.__init__(self, bind_address, port, logger_getter, "dez/cantools")
		self.memcache = get_memcache()
		self.curpath = None
		self.handlers = {}
		for key, val in static.items():
			self.add_static_rule(key, val)
		for key, val in cb.items():
			self.add_cb_rule(key, self._handler(key, val))

	def _respond(self, resp, *args, **kwargs):
		kwargs["response"] = resp
		do_respond(*args, **kwargs)

	def register_handler(self, args, kwargs):
		self.logger.info("register handler: %s"%(self.curpath,))
		self.handlers[self.curpath] = lambda resp : self._respond(resp, *args, **kwargs)

	def _handler(self, rule, target):
		self.logger.info("setting handler: %s %s"%(rule, target))
		def h(req):
			self.curpath = rule
			self.controller.current = self
			if rule not in self.handlers:
				self.logger.info("importing module: %s"%(target,))
				__import__(target)
			self.handlers[rule](Response(req))
		return h

class Web(CTWebBase):
	def __init__(self, bind_address, port):
		self.logger = logger_getter("Web")
		CTWebBase.__init__(self, bind_address, port)

class Admin(CTWebBase):
	def __init__(self, bind_address, port):
		self.logger = logger_getter("Admin")
		CTWebBase.__init__(self, bind_address, port, A_STATIC, A_CB)