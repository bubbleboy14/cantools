import subprocess
from optparse import OptionParser

def go():
	parser = OptionParser("python start.py [--port=PORT]")
	parser.add_option("-p", "--port", dest="port", default="8080", help="select your port (default=8080)")
	options, args = parser.parse_args()

	cmd = 'dev_appserver.py . --host=0.0.0.0 --port=%s --admin_port=8002 --datastore_path=db.datastore'%(options.port,)
	print cmd
	subprocess.call(cmd, shell=True)

if __name__ == "__main__":
	go()