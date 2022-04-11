"""
### Usage: ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [-n]

### Options:
	-h, --help                 show this help message and exit
	-d DOMAIN, --domain=DOMAIN
	                           domain of target server (default: localhost)
	-p PORT, --port=PORT       port of target server (default: 8080)
	-f FILENAME, --filename=FILENAME
	                           name of sqlite data file for dumping/loading to/from
	                           (default: dump.db)
	-s SKIP, --skip=SKIP       don't dump these tables - use '|' as separator, such
	                           as 'table1|table2|table3' (default: none)
	-t TABLES, --tables=TABLES dump these tables - use '|' as separator, such
	                           as 'table1|table2|table3' (default: all)
	-n, --no_binary            disable binary download
"""

import os, getpass
from optparse import OptionParser
from cantools import db
from cantools.web import fetch, post
from cantools.util import error, log, mkdir, cmd

LIMIT = 500

def load(host, port, session, filters={}, protocol="http", tables=None):
	pw = getpass.getpass("admin password? ")
	if port == 443:
		protocol = "https"
	log("loading database into %s://%s:%s"%(protocol, host, port), important=True)
	for model in (tables or db.get_schema()):
		load_model(model, host, port, session, filters=filters, protocol=protocol, pw=pw)
	log("finished loading data from sqlite dump file")

def load_model(model, host, port, session, filters={}, protocol="http", pw=None, action="put", blobifier=None):
#	log("retrieving %s entities"%(model,), important=True) # too spammy
	mod = db.get_model(model)
	def push(data):
		log(post(host, "/_db", port, {
			"pw": pw,
			"action": action,
			"data": data,
			"blobifier": blobifier
		}, protocol=protocol, ctjson=True))
	offset = 0
	while 1:
		chunk = db.get_page(model, LIMIT, offset, filters=filters, session=session)
		clen = len(chunk)
		if clen:
			if action == "edit":
				for item in chunk:
					push(item)
			else:
				push(chunk)
			offset += clen
			log("processed %s %s records"%(offset, model), 1)
		if clen < LIMIT:
			return offset

keys = {}
missing = {}
blobs = []
realz = set()
indices = set()

def fixmissing(orig):
	if orig in missing and orig in keys:
		for d in missing[orig]:
			for k, v in list(d.items()):
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
		for k, v in list(d.items()):
			if type(v) is list:
				d[k] = [val for val in v if val != badkey]
			elif v == badkey:
				d[k] = None
	del missing[badkey]

def prune():
	if missing:
		mlen = len(list(missing.keys()))
		log("pruning %s missing keys"%(mlen,), important=True)
		log("searching for matches")
		for oldkey in list(missing.keys()):
			fixmissing(oldkey)
		newlen = len(list(missing.keys()))
		log("matched %s - %s left over"%(mlen - newlen, newlen))
		log("deleting stragglers")
		for oldkey in list(missing.keys()):
			delmissing(oldkey)

def checkblobs(d, schema):
	for key, prop in list(schema.items()):
		if prop == "blob" and d[key]:
			blobs.append(d)
			break

def blobificator(host=None, port=None, dpref=None):
	dpref = dpref or "%s://%s:%s"%((port == 443) and "https" or "http",
		host, port)
	return dpref + "/_db?action=blob&key=%s&property=%s"

def blobify(d, blobifier, extant=None):
	for key, prop in list(db.get_schema(d["modelName"]).items()):
		if prop == "blob" and d[key]:
			entkey = d.get("gaekey", d["key"])
			if extant and getattr(extant, key): # skip if some blob is present.........
				log("%s.%s: already blobbed"%(d["modelName"], key))
				del d[key]
			else:
				log("fetching %s.%s (%s.%s)"%(d["modelName"], key, entkey, d[key]))
				d[key] = fetch(blobifier%(entkey, key))

def getblobs(host, port):
	log("retrieving binaries stored on %s records"%(len(blobs),), important=True)
	blobifier = blobificator(host, port)
	for d in blobs:
		blobify(d, blobifier)

def dump(host, port, session, binary, skip=[], tables=None):
	log("dumping database at %s:%s"%(host, port), important=True)
	mods = {}
	schemas = db.get_schema()
	for model in (tables or schemas):
		if model in skip:
			log("skipping %s entities"%(model,), important=True)
			continue
		log("retrieving %s entities"%(model,), important=True)
		schema = schemas[model]
		mods[model] = []
		offset = 0
		while 1:
			chunk = fetch(host, port=port, ctjson=True,
				path="/_db?action=get&modelName=%s&offset=%s&limit=%s"%(model, offset, LIMIT),
				protocol = (port == 443) and "https" or "http")
			for c in chunk:
				fixkeys(c, schema)
				checkblobs(c, schema)
			mods[model] += [c for c in chunk if c["modelName"] == model]
			offset += LIMIT
			if len(chunk) < LIMIT:
				break
			log("got %s %s records"%(offset, model), 1)
		log("found %s %s records"%(len(mods[model]), model))
	log("%s unmatched keys!"%(len(list(missing.keys())),), important=True)
	prune()
	if binary and blobs:
		getblobs(host, port)
	puts = []
	log("building models", important=True)
	for model in mods:
		mod = db.get_model(model)
		puts += [mod(**db.dprep(c)) for c in mods[model]]
	log("saving %s records to sqlite dump file"%(len(puts),))
	db.put_multi(puts, session=session, preserve_timestamps=True)

def blobdiff(cutoff):
	bz = os.listdir("blob")
	mkdir("blobdiff")
	for b in bz:
		if int(b) > cutoff:
			cmd("cp blob/%s blobdiff/%s"%(b, b))
	cmd("zip -r blobdiff.zip blobdiff")
	cmd("rm -rf blobdiff")

MODES = { "load": load, "dump": dump, "blobdiff": blobdiff }

def go():
	parser = OptionParser("ctmigrate [load|dump|blobdiff] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [--tables=TABLES] [--cutoff=CUTOFF] [-n]")
	parser.add_option("-d", "--domain", dest="domain", default="localhost",
		help="domain of target server (default: localhost)")
	parser.add_option("-p", "--port", dest="port", default=8080,
		help="port of target server (default: 8080)")
	parser.add_option("-c", "--cutoff", dest="cutoff", default=0,
		help="blobdiff cutoff - number to start after (default: 0)")
	parser.add_option("-f", "--filename", dest="filename", default="dump.db",
		help="name of sqlite data file for dumping/loading to/from (default: dump.db)")
	parser.add_option("-s", "--skip", dest="skip", default="",
		help="don't dump these tables - use '|' as separator, such as 'table1|table2|table3' (default: none)")
	parser.add_option("-t", "--tables", dest="tables", default="",
		help="dump these tables - use '|' as separator, such as 'table1|table2|table3' (default: all)")
	parser.add_option("-n", "--no_binary", dest="binary", action="store_false",
		default=True, help="disable binary download")
	options, args = parser.parse_args()
	if not args:
		error("no mode specified -- must be 'ctmigrate load' or 'ctmigrate dump'")
	import model # model loads schema
	mode = args[0]
	if mode in MODES:
		if mode == "blobdiff":
			blobdiff(int(options.cutoff))
		else:
			port = int(options.port)
			session = db.Session("sqlite:///%s"%(options.filename,))
			tabes = options.tables and options.tables.split("|")
			if mode == "load":
				load(options.domain, port, session, tables=tabes)
			elif mode == "dump":
				dump(options.domain, port, session, options.binary,
					options.skip and options.skip.split("|"), tabes)
	else:
		error("invalid mode specified ('%s')"%(mode,),
			"must be 'ctmigrate load' or ctmigrate dump'")
	log("everything seems to have worked -- you might want to run ctindex")
	log("goodbye")

if __name__ == "__main__":
	go()