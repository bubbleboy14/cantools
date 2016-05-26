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
from cantools.web import fetch
from cantools.util import error

def load(host, port, db, pw):
	# for model in schema
	#   hit db for all records (pages of 500)
	#   upload to host/port
	pass

def dump(host, port, db, pw):
	puts = []
	for model in db.get_schema():
		mod = db.get_model(model)
		these = []
		while 1:
			chunk = fetch(host, port=port,
				path="/_db?action=get&modelName=%s&offset=%s&limit=500"%(model, offset))
			these += [mod(**c) for c in chunk]
			if len(chunk) < 500:
				break
		puts += these
#	db.put_multi(puts)

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
	from cantools import db # loads w/ sqlite session
	if mode is "load":
		load(options.host, options.port, db, pw)
	elif mode is "dump":
		dump(options.host, options.port, db, pw)
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")

if __name__ == "__main__":
	go()