import requests
from rel import abort_branch
from dez.http import fetch as dfetch
from dez.http.server import HTTPResponse
from dez.http.application import HTTPApplication
from dez.logging import get_logger_getter
from dez.memcache import get_memcache
from ...util import log as syslog
from ..util import *
from routes import static, cb
from mail import send_mail
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
			set_read(lambda : req.body or json.dumps(req.qs_params))
			set_header(resp.__setitem__)
			set_send(resp.write)
			set_close(lambda : resp.dispatch(abort_branch))
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

def fetch(host, path="/", port=80, asjson=False, cb=None, timeout=1, async=False):
	if async:
		return dfetch(host, port, cb, timeout, asjson)
	result = requests.get("http://%s:%s%s"%(host, port, path)).content
	return asjson and json.loads(result) or result

# file uploads
def read_file(data_field):
	return data_field.file.read()

# memcache stuff
def getmem(key, tojson=True):
	return DWEB.memcache.get(key, tojson)

def setmem(key, val, fromjson=True):
	DWEB.memcache.set(key, val, tojson)

def delmem(key):
	DWEB.memcache.rm(key)

def clearmem():
	DWEB.memcache.clear()

def getcache():
	return DWEB.memcache.cache

set_getmem(getmem)
set_setmem(setmem)
set_delmem(delmem)
set_clearmem(clearmem)

if __name__ == "__main__":
	run_dez_webserver()