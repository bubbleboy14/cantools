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
realz = set()

def fixmissing(orig):
	if orig in missing and orig in keys:
		for d in missing[orig]:
			for k, v in d.items():
				if type(v) is list:
					for i in range(len(v)):
						if v[i] == orig:
							v[i] = keys[orig]
				elif v == orig:
					d[k] = keys[orig]
		del missing[orig]

def _missing(k, d):
	if k not in missing:
		missing[k] = []
	missing[k].append(d)

def _fix_or_miss(d, prop):
	dk = d[prop]
	if type(dk) is list:
		for i in range(len(dk)):
			k = dk[i]
			if k in keys:
				dk[i] = keys[k]
			else:
				_missing(k, d)
	elif dk:
		if dk in keys:
			d[prop] = keys[dk]
		else:
			_missing(dk, d)

def fixkeys(d, schema):
	if "ctkey" in d:
		orig = d["key"]
		old = d["oldkey"]
		d["key"] = keys[orig] = keys[old] = d["ctkey"]
		realz.add(d["key"])
		fixmissing(orig)
		fixmissing(old)
		for prop in schema["_kinds"]:
			_fix_or_miss(d, prop)

def delmissing(orig):
	for d in missing[orig]:
		for k, v in d.items():
			if type(v) is list:
				d[k] = [val for val in v if val != orig]
			elif v == orig:
				d[k] = None
	del missing[orig]

def prune():
	if missing:
		mlen = len(missing.keys())
		log("pruning %s missing keys"%(mlen,), important=True)
		log("searching for matches")
		for oldkey in missing.keys():
			fixmissing(oldkey)
		newlen = len(missing.keys())
		log("matched %s - %s left over"%(mlen - newlen, newlen))
		log("deleting stragglers")
		for oldkey in missing.keys():
			delmissing(oldkey)

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
	log("%s unmatched keys!"%(len(missing.keys()),), important=True)
	prune()
	puts = []
	log("building models", important=True)
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