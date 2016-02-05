import sys
from rel import abort_branch
from dez.logging import get_logger_getter
from dez.memcache import get_memcache
from dez.http.server import HTTPResponse
from dez.http.application import HTTPApplication
from routes import static, cb
from ..util import *
from ...util import log as syslog
sys.path.insert(0, ".") # for dynamically loading modules

logger_getter = get_logger_getter("dez", syslog)
A_STATIC = { "/": "_", "/js/CT/": "js/CT" }
A_CB = { "/admin": "admin" }

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

	def register_handler(self, args, kwargs):
		self.logger.info("register handler: %s"%(self.curpath,))
		self.handlers[self.curpath] = lambda : do_respond(*args, **kwargs)

	def _handler(self, rule, target):
		self.logger.info("setting handler: %s %s"%(rule, target))
		def h(req):
			resp = HTTPResponse(req)
			set_read(lambda : req.body or json.dumps(rb64(req.qs_params)))
			set_header(resp.__setitem__)
			set_send(resp.write)
			set_close(lambda : resp.dispatch(abort_branch))
			self.curpath = rule
			self.controller.current = self
			if rule not in self.handlers:
				self.logger.info("importing module: %s"%(target,))
				__import__(target)
			self.logger.info("invoking handler: %s"%(rule,))
			self.handlers[rule]()
		return h

class Web(CTWebBase):
	def __init__(self, bind_address, port):
		self.logger = logger_getter("Web")
		CTWebBase.__init__(self, bind_address, port)

class Admin(CTWebBase):
	def __init__(self, bind_address, port):
		self.logger = logger_getter("Admin")
		CTWebBase.__init__(self, bind_address, port, A_STATIC, A_CB)