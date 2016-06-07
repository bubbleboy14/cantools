"""
### Usage: ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME]

### Options:
	-h, --help            show this help message and exit
	-d DOMAIN, --domain=DOMAIN
						  domain of target server (default: localhost)
	-p PORT, --port=PORT  port of target server (default: 8080)
	-f FILENAME, --filename=FILENAME
						  name of sqlite data file for dumping/loading to/from
						  (default: dump.db)
"""

import getpass
from optparse import OptionParser
from cantools import db
from cantools.web import fetch, post
from cantools.util import error, log

LIMIT = 500

def load(host, port, session):
	pw = getpass.getpass("admin password? ")
	log("loading database into %s:%s"%(host, port), important=True)
	for model in db.get_schema():
		log("retrieving %s entities"%(model,), important=True)
		mod = db.get_model(model)
		offset = 0
		while 1:
			chunk = db.get_page(model, LIMIT, offset, session=session)
			log(post(host, "/_db", port, {
				"pw": pw,
				"action": "put",
				"data": chunk
			}, ctjson=True))
			offset += LIMIT
			if len(chunk) < LIMIT:
				break
			log("processed %s %s records"%(offset, model), 1)
	log("finished loading data from sqlite dump file")

keys = {}
missing = {}

def fixmissing(orig):
	if orig in missing:
		for d in missing[orig]:
			for k in d:
				if type(d[k]) is list:
					for i in range(len(d[k])):
						if d[k][i] == orig:
							d[k][i] = keys[orig]
				elif d[k] == orig:
					d[k] = keys[orig]
		del missing[orig]

def _missing(k, d):
	if k not in missing:
		missing[k] = []
	missing[k].append(d)

def _fix_or_miss(d, kind):
	dk = d[kind]
	if type(dk) is list:
		for i in range(len(dk)):
			k = dk[i]
			if k in keys:
				dk[i] = keys[k]
			else:
				_missing(k, d)
	elif dk:
		if dk in keys:
			d[kind] = keys[dk]
		else:
			_missing(dk, d)

def fixkeys(d, schema):
	if "ctkey" in d:
		orig = d["key"]
		d["key"] = keys[orig] = d["ctkey"]
		del d["ctkey"]
		fixmissing(orig)
		for kind in schema["_kinds"]:
			_fix_or_miss(d, kind)

def dump(host, port, session):
	log("dumping database at %s:%s"%(host, port), important=True)
	mods = {}
	schemas = db.get_schema()
	for model in schemas:
		log("retrieving %s entities"%(model,), important=True)
		schema = schemas[model]
		mods[model] = []
		limit = "binary" in schema.values() and 5 or LIMIT
		offset = 0
		while 1:
			chunk = fetch(host, port=port, ctjson=True,
				path="/_db?action=get&modelName=%s&offset=%s&limit=%s"%(model, offset, limit))
			for c in chunk:
				fixkeys(c, schema)
			mods[model] += chunk
			offset += limit
			if len(chunk) < limit:
				break
			log("got %s %s records"%(offset, model), 1)
		log("found %s %s records"%(len(mods[model]), model))
	puts = []
	log("building models")
	for model in mods:
		mod = db.get_model(model)
		puts += [mod(**db.dprep(c)) for c in mods[model]]
	log("saving %s records to sqlite dump file"%(len(puts),))
	db.put_multi(puts, session=session)

MODES = { "load": load, "dump": dump }

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
	import model # model loads schema
	mode = args[0]
	if mode in MODES:
		MODES[mode](options.domain, int(options.port),
			db.Session("sqlite:///%s"%(options.filename,)))
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")
	log("everything seems to have worked -- you might want to run ctindex")
	log("goodbye")

if __name__ == "__main__":
	go()