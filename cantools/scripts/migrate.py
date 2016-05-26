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

import json
from optparse import OptionParser
from cantools import config
from cantools.web import fetch
from cantools.util import error, log

LIMIT = 500

def load(host, port, db, pw):
	log("loading database into %s:%s"%(host, port), important=True)
	for model in db.get_schema():
		log("retrieving %s entities"%(model,), important=True)
		mod = db.get_model(model)
		offset = 0
		while 1:
			chunk = db.get_page(model, LIMIT, offset)
			# TODO: push to host:port
			offset += LIMIT
			if len(chunk) < LIMIT:
				break
			log("processed %s %s records"%(offset, model), 1)
	log("finished loading data from sqlite dump file")

def dump(host, port, db, pw):
	log("dumping database at %s:%s"%(host, port), important=True)
	puts = []
	for model in db.get_schema():
		log("retrieving %s entities"%(model,), important=True)
		mod = db.get_model(model)
		these = []
		offset = 0
		while 1:
			chunk = json.loads(fetch(host, port=port,
				path="/_db?action=get&modelName=%s&offset=%s&limit=%s"%(model, offset, LIMIT))[1:])
			these += [mod(**c) for c in chunk]
			offset += LIMIT
			if len(chunk) < LIMIT:
				break
			log("got %s %s records"%(len(these), model), 1)
		puts += these
		log("found %s %s records - %s records total"%(len(these), model, len(puts)))
	log("saving %s records to sqlite dump file"%(len(puts),))
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
	log("goodbye")

if __name__ == "__main__":
	go()