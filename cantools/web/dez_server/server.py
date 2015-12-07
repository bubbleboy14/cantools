from dez.http.server import HTTPResponse
from dez.http.application import HTTPApplication
from dez.logging import get_logger_getter
from dez.memcache import get_memcache
from ...scripts.util import log as syslog
from ..util import *
from routes import static, cb
sys.path.insert(0, ".") # for dynamically loading modules

DWEB = None

class Web(HTTPApplication):
	def __init__(self, bind_address, port):
		logger_getter = get_logger_getter("dez webserver", syslog)
		self.logger = logger_getter("Web (HTTPApplication)")
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
			set_read(lambda : req.body)
			set_send(resp.write)
			set_close(resp.dispatch)
			self.curpath = rule
			if rule not in self.handlers:
				self.logger.info("importing module: %s"%(target,))
				__import__(target)
			self.logger.info("invoking handler: %s"%(rule,))
			self.handlers[rule]()
		return h

def run_dez_webserver(host="localhost", port=8080):
	global DWEB
	DWEB = Web(host, port)
	setlog(DWEB.logger.simple)
	DWEB.start()

def get_dez_webserver():
	return DWEB

def respond(*args, **kwargs):
	DWEB.register_handler(args, kwargs)

# memcache stuff
def getmem(key, tojson=True):
	return DWEB.memcache.get(key, tojson)

def setmem(key, val, fromjson=True):
	DWEB.memcache.set(key, val, tojson)

def delmem(key):
	DWEB.memcache.rm(key)

def clearmem():
	DWEB.memcache.clear()

if __name__ == "__main__":
	run_dez_webserver()