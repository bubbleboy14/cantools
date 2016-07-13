"""
### Usage: ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [-n]

### Options:
	-h, --help            show this help message and exit
	-d DOMAIN, --domain=DOMAIN
	                      domain of target server (default: localhost)
	-p PORT, --port=PORT  port of target server (default: 8080)
	-f FILENAME, --filename=FILENAME
	                      name of sqlite data file for dumping/loading to/from
	                      (default: dump.db)
	-s SKIP, --skip=SKIP  don't dump these tables - use '|' as separator, such
	                      as 'table1|table2|table3' (default: none)
	-n, --no_binary       disable binary download
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
blobs = []
realz = set()
indices = set()

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
		orig = d["gaekey"] = d["key"]
		old = d["oldkey"]
		d["key"] = keys[orig] = keys[old] = d["ctkey"]
		realz.add(d["key"])
		fixmissing(orig)
		fixmissing(old)
		if d["index"] in indices:
			error("duplicate index! (%s)"%(d["index"],),
				"try running 'ctindex -m index' ;)")
		indices.add(d["index"])
		for prop in schema["_kinds"]:
			_fix_or_miss(d, prop)

def delmissing(badkey):
	log("deleting references to %s"%(badkey,), important=True)
	for d in missing[badkey]:
		log("purging %s"%(d,), important=True)
		for k, v in d.items():
			if type(v) is list:
				d[k] = [val for val in v if val != badkey]
			elif v == badkey:
				d[k] = None
	del missing[badkey]

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

def checkblobs(d, schema):
	for key, prop in schema.items():
		if prop == "blob" and d[key]:
			blobs.append(d)
			break

def getblobs(host, port):
	log("retrieving binaries stored on %s records"%(len(blobs),), important=True)
	for d in blobs:
		for key, prop in db.get_schema(d["modelName"]).items():
			if prop == "blob" and d[key]:
				entkey = d.get("gaekey", d["key"])
				log("fetching %s.%s (%s.%s)"%(d["modelName"], key, entkey, d[key]))
				d[key] = fetch(host, port=port,
					path="/_db?action=blob&key=%s&property=%s"%(entkey, key))

def dump(host, port, session, binary, skip=[]):
	log("dumping database at %s:%s"%(host, port), important=True)
	mods = {}
	schemas = db.get_schema()
	for model in schemas:
		if model in skip:
			log("skipping %s entities"%(model,), important=True)
			continue
		log("retrieving %s entities"%(model,), important=True)
		schema = schemas[model]
		mods[model] = []
		offset = 0
		while 1:
			chunk = fetch(host, port=port, ctjson=True,
				path="/_db?action=get&modelName=%s&offset=%s&limit=%s"%(model, offset, LIMIT))
			for c in chunk:
				fixkeys(c, schema)
				checkblobs(c, schema)
			mods[model] += [c for c in chunk if c["modelName"] == model]
			offset += LIMIT
			if len(chunk) < LIMIT:
				break
			log("got %s %s records"%(offset, model), 1)
		log("found %s %s records"%(len(mods[model]), model))
	log("%s unmatched keys!"%(len(missing.keys()),), important=True)
	prune()
	if binary and blobs:
		getblobs(host, port)
	puts = []
	log("building models", important=True)
	for model in mods:
		mod = db.get_model(model)
		puts += [mod(**db.dprep(c)) for c in mods[model]]
	log("saving %s records to sqlite dump file"%(len(puts),))
	db.put_multi(puts, session=session)

MODES = { "load": load, "dump": dump }

def go():
	parser = OptionParser("ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [-n]")
	parser.add_option("-d", "--domain", dest="domain", default="localhost",
		help="domain of target server (default: localhost)")
	parser.add_option("-p", "--port", dest="port", default=8080,
		help="port of target server (default: 8080)")
	parser.add_option("-f", "--filename", dest="filename", default="dump.db",
		help="name of sqlite data file for dumping/loading to/from (default: dump.db)")
	parser.add_option("-s", "--skip", dest="skip", default="",
		help="don't dump these tables - use '|' as separator, such as 'table1|table2|table3' (default: none)")
	parser.add_option("-n", "--no_binary", dest="binary", action="store_false",
		default=True, help="disable binary download")
	options, args = parser.parse_args()
	if not args:
		error("no mode specified -- must be 'ctmigrate load' or 'ctmigrate dump'")
	import model # model loads schema
	mode = args[0]
	if mode in MODES:
		port = int(options.port)
		session = db.Session("sqlite:///%s"%(options.filename,))
		if mode == "load":
			load(options.domain, port, session)
		elif mode == "dump":
			dump(options.domain, port, session, options.binary, options.skip and options.skip.split("|"))
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")
	log("everything seems to have worked -- you might want to run ctindex")
	log("goodbye")

if __name__ == "__main__":
	go()