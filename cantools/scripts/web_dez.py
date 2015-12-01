from dez.http.application import HTTPApplication
from dez.logging import get_logger
from scripts.util import log

class Web(HTTPApplication):
	def __init__(self, bind_address, port):
		logger_getter = get_logger("dez webserver", log)
		self.logger = logger_getter("Web")
		self.log = self.logger.info
		HTTPApplication.__init__(self, bind_address, port, logger_getter, "dez/cantools")
		self.add_static_rule("/js", "js")
		self.add_static_rule("/", "html")

def run_dez_webserver(host="localhost", port=8080):
	Web(host, port).start()

if __name__ == "__main__":
	run_dez_webserver()