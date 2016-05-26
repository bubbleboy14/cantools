"""
### Usage: ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT]

### Options:
	-h, --help            show this help message and exit
	-d DOMAIN, --domain=DOMAIN
						  domain of target server (default: localhost)
	-p PORT, --port=PORT  port of target server (default: 8080)
	-f FILENAME, --filename=FILENAME
						  name of sqlite data file for dumping/loading to/from
						  (default: dump.db)
"""

from optparse import OptionParser
from cantools.util import error

def load(host, port, dbstring):
	# open db session
	# for model in schema
	#   hit host/port for all records
	#   save locally
	pass

def dump(host, port, dbstring):
	pass
	# open db session
	# for model in schema
	#   hit db for all records
	#   upload to host/port

def go():
	parser = OptionParser("ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME]")
	parser.add_option("-d", "--domain", dest="domain", default="localhost",
		help="domain of target server (default: localhost)")
	parser.add_option("-p", "--port", dest="port", default=8080,
		help="port of target server (default: 8080)")
	parser.add_option("-f", "--filename", dest="filename", default="dump.db",
		help="name of sqlite data file for dumping/loading to/from (default: dump.db)")
	options, args = parser.parse_args()
	if not args:
		error("no mode specified -- must be 'ctmigrate load' or 'ctmigrate dump'")
	mode = args[0]
	options.port = int(options.port)
	options.filename = "sqlite:///%s"%(options.filename,)
	if mode is "load":
		load(options.host, options.port, options.filename)
	elif mode is "dump":
		dump(options.host, options.port, options.filename)
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")

if __name__ == "__main__":
	go()