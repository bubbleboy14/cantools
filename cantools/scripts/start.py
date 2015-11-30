import subprocess
from optparse import OptionParser

def go():
	parser = OptionParser("ctstart [--port=PORT]")
	parser.add_option("-p", "--port", dest="port", default="8080", help="select your port (default=8080)")
	parser.add_option("-d", "--datastore", dest="datastore", default="scripts/db.datastore", help="select your datastore file (default=scripts/db.datastore)")
	options, args = parser.parse_args()

	cmd = 'dev_appserver.py . --host=0.0.0.0 --port=%s --admin_port=8002 --datastore_path=%s'%(options.port, options.datastore)
	print cmd
	subprocess.call(cmd, shell=True)

if __name__ == "__main__":
	go()