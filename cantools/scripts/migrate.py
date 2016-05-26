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
from cantools import config
from cantools.util import error

def load(host, port, session, schema, pw):
	# for model in schema
	#   hit db for all records (pages of 500)
	#   upload to host/port
	pass

def dump(host, port, session, schema, pw):
	# for model in schema
	#   hit host/port for all records (pages of 500)
	#   save locally
	pass

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
	pw = raw_input("admin password? ")
	config.db.update("main", "sqlite:///%s"%(options.filename,))
	import model # loads schema
	from cantools.db import session, get_schema # sqlite session
	schema = get_schema()
	if mode is "load":
		load(options.host, options.port, session, schema, pw)
	elif mode is "dump":
		dump(options.host, options.port, session, schema, pw)
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")

if __name__ == "__main__":
	go()