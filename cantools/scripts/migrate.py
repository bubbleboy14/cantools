"""
### Usage: ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT]

### Options:
	-h, --help            show this help message and exit
	-d DOMAIN, --domain=DOMAIN
						  domain of target server (default: localhost)
	-p PORT, --port=PORT  port of target server (default: 8080)
"""

from optparse import OptionParser
from cantools.util import error

def load(host, port):
	pass

def dump(host, port):
	pass

def go():
	parser = OptionParser("ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT]")
	parser.add_option("-d", "--domain", dest="domain", default="localhost",
		help="domain of target server (default: localhost)")
	parser.add_option("-p", "--port", dest="port", default=8080,
		help="port of target server (default: 8080)")
	options, args = parser.parse_args()
	if not args:
		error("no mode specified -- must be 'ctmigrate load' or 'ctmigrate dump'")
	mode = args[0]
	if mode is "load":
		load(options.host, int(options.port))
	elif mode is "dump":
		dump(options.host, int(options.port))
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")

if __name__ == "__main__":
	go()