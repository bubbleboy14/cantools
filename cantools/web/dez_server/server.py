from dez.http.application import HTTPApplication
from dez.logging import get_logger
from ...scripts.util import log as syslog
from ..util import *
from routes import static, cb

DWEB = None

class Web(HTTPApplication):
	def __init__(self, bind_address, port):
		HTTPApplication.__init__(self, bind_address, port,
			get_logger("dez webserver", log), "dez/cantools")
		for key, val in static.items():
			self.add_static_rule(key, val)
		for key, val in cb.items():
			self.add_cb_rule(key, val)

def run_dez_webserver(host="localhost", port=8080):
	global DWEB
	DWEB = Web(host, port)
	DWEB.start()

def get_dez_webserver():
	return DWEB

if __name__ == "__main__":
	run_dez_webserver()