from optparse import OptionParser
from util import error
from config import config

def go():
	parser = OptionParser("ctstart [--web_backend=BACKEND] [--port=PORT] [--datastore=DS_PATH]")
	parser.add_option("-w", "--web_backend", dest="web_backend", default=config.web_server,
		help="web backend. options: dez, gae. (default: %s)"%(config.web_server,))
	parser.add_option("-p", "--port", dest="port", default="8080",
		help="select your port (default=8080)")
	parser.add_option("-d", "--datastore", dest="datastore", default="scripts/db.datastore",
		help="[gae only] select your datastore file (default=scripts/db.datastore)")
	options, args = parser.parse_args()

	if options.web_backend == "gae":
		import subprocess
		cmd = 'dev_appserver.py . --host=0.0.0.0 --port=%s --admin_port=8002 --datastore_path=%s'%(options.port, options.datastore)
		print cmd
		subprocess.call(cmd, shell=True)
	elif options.web_backend == "dez":
		from cantools.web import run_dez_webserver
		run_dez_webserver(port=int(options.port))
	else:
		error("invalid web_backend: %s"%(options.web_backend,))

if __name__ == "__main__":
	go()