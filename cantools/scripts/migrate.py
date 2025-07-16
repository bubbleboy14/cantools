"""
### Usage: ctmigrate [load|dump|blobdiff|snap|accounts|deps|pack|unpack|owners|finish|install|profile] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [--tables=TABLES] [--cutoff=CUTOFF] [-nr]

### Options:
    -h, --help            show this help message and exit
    -d DOMAIN, --domain=DOMAIN
                          domain of target server (default: localhost)
    -p PORT, --port=PORT  port of target server (default: 8080)
    -c CUTOFF, --cutoff=CUTOFF
                          blobdiff cutoff - number to start after (default: 0)
    -f FILENAME, --filename=FILENAME
                          name of sqlite data file for dumping/loading to/from
                          (default: dump.db)
    -s SKIP, --skip=SKIP  don't dump these tables - use '|' as separator, such
                          as 'table1|table2|table3' (default: none)
    -t TABLES, --tables=TABLES
                          dump these tables - use '|' as separator, such as
                          'table1|table2|table3' (default: all)
    -n, --no_binary       disable binary download
    -r, --dry_run         accounts/deps/pack/unpack/owners/finish/install/profile
                          dry run
"""

import os, getpass, datetime
from optparse import OptionParser
from databae.util import blobify
from fyg.util import log, error, write, confirm
from cantools import db
from cantools.util import mkdir, cmd, output, sym
from cantools.util.admin import install, snapinstall, simplecfg, enc, dec, qdec, phpver, running, servicer, mysqlcheck, zipit

LIMIT = 500

def load(host, port, session, filters={}, protocol="http", tables=None):
	pw = getpass.getpass("admin password? ")
	if port == 443:
		protocol = "https"
	log("loading database into %s://%s:%s"%(protocol, host, port), important=True)
	for model in (tables or db.get_schema()):
		load_model(model, host, port, session, filters=filters, protocol=protocol, pw=pw)
	log("finished loading data from sqlite dump file")

def load_model(model, host, port, session=None, filters={}, protocol="http", pw=None, action="put", blobifier=None):
	from cantools.web import post
#	log("retrieving %s entities"%(model,), important=True) # too spammy
	session = session or db.seshman.get()
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

def getblobs(host, port):
	log("retrieving binaries stored on %s records"%(len(blobs),), important=True)
	blobifier = blobificator(host, port)
	for d in blobs:
		blobify(d, blobifier)

def dump(host, port, session, binary, skip=[], tables=None):
	from cantools.web import fetch
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

def dumpit(user, dname=None):
	dname = dname or "dbz.sql"
	log("dumping databases to %s"%(dname,), important=True)
	cmd("mysqldump -u %s -p --all-databases > %s"%(user, dname))

def undumpit(user, dname=None, noautocommit=True):
	dname = dname or "dbz.sql"
	log("undumping databases from %s"%(dname,), important=True)
	if noautocommit:
		cmd('mysql -u %s -p -e "SET autocommit=0; SOURCE %s; COMMIT;"'%(user, dname))
	else:
		cmd("mysql -u %s -p < %s"%(user, dname))

def blobdiff(cutoff):
	bz = os.listdir("blob")
	mkdir("blobdiff")
	for b in bz:
		if int(b) > cutoff:
			cmd("cp blob/%s blobdiff/%s"%(b, b))
	zipit("blobdiff", remove=True)

def projpath():
	path = os.path.join(*os.path.abspath(".").rsplit("/", 2)[1:])
	return input("what's the project's path? [default: %s] "%(path,)) or path

def scp(user, domain, path, keyfile=None, isdir=False):
	line = ["scp"]
	isdir and line.append("-r")
	keyfile and line.append("-i %s"%(keyfile,))
	line.append("%s@%s:%s ."%(user, domain, path))
	cmd(" ".join(line))

def askArch(path):
	if not os.path.exists(path):
		return
	if not confirm("%s exists - should i archive it"%(path,), True):
		return log("ok, i'm overwriting it!", important=True)
	newpath = "%s%s"%(path, str(datetime.datetime.now()).split(" ").pop(0))
	log("ok, i'm moving it to %s"%(newpath,))
	os.rename(path, newpath)

def askGet(path, user, domain, basepath, projpath, keyfile=None, isdir=False):
	if not confirm("should i get %s"%(path,), True):
		return
	askArch(path)
	scp(user, domain, "/%s/%s/%s"%(basepath, projpath, path), keyfile, isdir)

def askBasePath(user):
	if user == "root":
		basepath = "root"
	else:
		basepath = "home/%s"%(user,)
	return input("what's the base path? [default: %s] "%(basepath,)) or basepath

def doGets(user, domain, projpath, keyfile):
	basepath = askBasePath(user)
	askGet("data.db", user, domain, basepath, projpath, keyfile)
	askGet("blob", user, domain, basepath, projpath, keyfile, True)
	askGet("pack.zip", user, domain, basepath, projpath, keyfile)
	otherPath = input("anything else? [default: nah] ")
	while otherPath:
		askGet(otherPath, user, domain, basepath, projpath, keyfile,
			input("is that a directory? [default: nope] "))
		otherPath = input("anything else? [default: nah] ")

def snap(domain):
	if domain == "ask":
		domain = input("what's the snap domain? ")
	doGets(input("what's the user? [default: root]: ") or "root",
		domain, projpath(), input("what's the key file? [default: none] "))

def drylog(cfg):
	for variety in cfg:
		for line in cfg[variety]:
			log("%s: %s"%(variety, line), 1)

def prodeps(pman):
	cfg = simplecfg("%s.profile"%(pman,))
	bcfg = cfg and cfg.get("basic")
	if not bcfg:
		return
	if pman == "apt": # else snap or snap classic
		return install(*bcfg)
	isclas = pman == "clasnap"
	for pkg in bcfg:
		snapinstall(pkg, isclas)

def deps(dryrun=False):
	cfg = simplecfg("deps.cfg")
	if not cfg: return
	log("installing dependencies", important=True)
	if dryrun:
		return drylog(cfg)
	if "basic" in cfg:
		install(*cfg["basic"])
	if "snap" in cfg:
		for pkg in cfg["snap"]:
			snapinstall(pkg)
	if "clasnap" in cfg:
		for pkg in cfg["clasnap"]:
			snapinstall(pkg, True)
	if "pro" in cfg:
		for pman in cfg["pro"]:
			prodeps(pman)

def usergroup(cfg, recursive=True, nobasic=False):
	chowner = "chown"
	if recursive:
		chowner = "%s -R"%(chowner,)
	if not nobasic and "basic" in cfg:
		for oline in cfg["basic"]:
			o, p = oline.split("@")
			cmd("%s %s:%s %s"%(chowner, o, o, p), sudo=True)
	if "user" in cfg:
		for oline in cfg["user"]:
			o, p = oline.split("@")
			cmd("%s %s: %s"%(chowner, o, p), sudo=True)
	if "group" in cfg:
		for oline in cfg["group"]:
			o, p = oline.split("@")
			cmd("%s :%s %s"%(chowner, o, p), sudo=True)

def accounts(dryrun=False):
	cfg = simplecfg("accounts.cfg")
	if not cfg: return
	log("setting up accounts", important=True)
	if dryrun:
		return drylog(cfg)
	if "basic" in cfg: # system-level
		for uline in cfg["basic"]:
			u, p = uline.split("@")
			p = qdec(p, asdata=True)
			cmd('useradd -m -p "%s" %s'%(p, u), sudo=True)
	if "mysql" in cfg:
		for uline in cfg["mysql"]:
			log("mysql account creation unimplemented: %s"%(uline,))
	usergroup(cfg, nobasic=True) # for pre-unpack permissions

def owners(dryrun=False, recursive=True):
	cfg = simplecfg("owners.cfg")
	if not cfg: return
	log("assigning owners", important=True)
	if dryrun:
		return drylog(cfg)
	usergroup(cfg, recursive=recursive)

packs = ["mysql", "basic", "multi", "zip", "rephp", "sym", "crontab"]

class Packer(object):
	def __init__(self, dryrun=False):
		self.index = 0
		self.dryrun = dryrun
		self.cfg = simplecfg("pack.cfg")

	def log(self, msg, level=0, important=False):
		log("Packer: %s"%(msg,), level, important)

	def confset(self, name):
		if name in self.cfg:
			return self.cfg[name]
		self.log("no %s items"%(name,))
		return []

	def proc(self, name, reverse=False):
		funame = reverse and "un%s"%(name,) or name
		preposition = reverse and "to" or "from"
		fun = getattr(self, funame)
		for fname in self.confset(name):
			self.log("%s %s %s %s"%(funame, self.index, preposition, fname))
			self.dryrun or fun(fname, str(self.index))
			self.index += 1

	def basic(self, fname, oname):
		enc(fname, oname)

	def unbasic(self, fname, oname):
		dec(oname, fname)

	def multi(self, fline, oname):
		enc(fline.split("|").pop(0), oname)

	def unmulti(self, fline, oname):
		for fname in fline.split("|"):
			dec(oname, fname)

	def zip(self, fname, oname):
		if "/" in fname:
			jumpzip(fname, oname, keepsyms="ask")
		else:
			zipit(fname, oname, keepsyms="ask")

	def unzip(self, fname, oname):
		cmd("unzip %s -d %s"%(oname, fname.rsplit("/", 1).pop(0)))

	def crontab(self, nothing, oname):
		enc(output("crontab -l"), oname, asdata=True)

	def uncrontab(self, nothing, oname):
		cmd("ctutil admin qdec %s | crontab -"%(oname,))

	def mysql(self, uname, oname):
		dumpit(uname or "root", oname)

	def unmysql(self, uname, oname):
		uname = uname or "root"
		hostname = "localhost"
		if "@" in uname:
			uname, hostname = uname.split("@")
		mysqlcheck(uname, hostname, "ask")
		undumpit(uname, oname)

	def sym(self, fline, oname):
		self.log("sym(%s->%s) - noop"%(fline, oname))

	def unsym(self, fline, oname):
		src, dest = fline.split("@")
		sym(src, dest)

	def rephp(self, fname, oname):
		enc(fname, oname, replace=("php%s"%(phpver(),), "php_PVER_"))

	def unrephp(self, fname, oname):
		dec(oname, fname, replace=("php_PVER_", "php%s"%(phpver(),)))

	def pack(self):
		if not self.cfg: return
		self.log("packing", important=True)
		mkdir("pack")
		os.chdir("pack")
		for psub in packs:
			self.proc(psub)
		os.chdir("..")
		zipit("pack", remove=True)

	def unpack(self):
		if not self.cfg: return
		self.log("unpacking", important=True)
		cmd("unzip pack.zip")
		os.chdir("pack")
		for psub in packs:
			self.proc(psub, True)
		os.chdir("..")

def pack(dryrun=False):
	Packer(dryrun).pack()

def unpack(dryrun=False):
	Packer(dryrun).unpack()

def dofrom(path, fun):
	opath = os.path.abspath(".")
	os.chdir(path)
	fun()
	os.chdir(opath)

def jumpsnap(domain, path, grabPack=True):
	dofrom(path, lambda : snap(domain))
	grabPack and cmd("mv %s ."%(os.path.join(path, "pack.zip"),))

def jumpzip(fline, oname, keepsyms=False):
	fpath, fname = fline.rsplit("/", 1)
	dofrom(fpath, lambda : zipit(fname, keepsyms=keepsyms))
	cmd("mv %s.zip %s"%(fline, oname))

def runcfg(name, cbs, dryrun=False):
	cfg = simplecfg("%s.cfg"%(name,), True) or []
	for step in cfg:
		v = step["variety"]
		line = step["line"]
		if dryrun:
			log("%s %s %s"%(name, v, line), 1)
		elif v in cbs:
			cbs[v](line)
		elif v == "basic":
			cmd(line)
		else:
			error("unrecognized mode ('%s') for line: %s"%(v, line))

def certer(line):
	cmd("certbot certonly --standalone -d %s"%(" -d ".join(line.split("|")),))

def servset(line):
	for service in line.split("|"):
		servicer(service)

def finish(dryrun=False):
	log("finishing installation", important=True)
	runcfg("finish", {
		"cert": certer,
		"services": servset
	}, dryrun)
	running("cron") or servicer("cron", "start", ask=True)

def snapper(line):
	if "@" in line:
		jumpsnap(*line.split("@"))
	else:
		snap(line)

def doinstall(dryrun=False):
	log("running installation", important=True)
	confirm("install dependencies", True) and deps(dryrun)
	runcfg("install", { "snap": snapper }, dryrun)
	confirm("setup accounts", True) and accounts(dryrun)
	confirm("unpack pack", True) and unpack(dryrun)
	confirm("update owners", True) and owners(dryrun)
	if confirm("finish off installation"):
		finish(dryrun)
	else:
		log("ok, deferring final steps - type 'ctmigrate finish' to complete the installation", important=True)
		running("cron") and servicer("cron", "stop", ask=True)

def prolog(pman, data, dryrun=False):
	if not data:
		log("no %s packages installed!"%(pman,), important=True)
	elif dryrun:
		log("%s profile:\n\n%s"%(pman, data))
	else:
		write(data, "%s.profile"%(pman,))

def profile(dryrun=False):
	log("system package profiler", important=True)
	if confirm("profile aptitude", True):
		ilist = output("apt list --installed").split("Listing...\n").pop().split("\n")
		if not confirm("allow local packages"):
			ilist = list(filter(lambda i : not i.endswith("local]"), ilist))
		apro = "\n".join([line.split("/").pop(0) for line in ilist])
		prolog("apt", apro, dryrun)
	if confirm("profile snap", True):
		snas = []
		clas = []
		for line in output("snap list").split("\n")[1:]:
			name = line.split(" ").pop(0)
			if "classic" in line:
				clas.append(name)
			else:
				snas.append(name)
		prolog("snap", "\n".join(snas), dryrun)
		prolog("clasnap", "\n".join(clas), dryrun)

MODES = { "load": load, "dump": dump, "blobdiff": blobdiff, "snap": snap, "accounts": accounts, "deps": deps, "pack": pack, "unpack": unpack, "owners": owners, "finish": finish, "install": doinstall, "profile": profile }

def go():
	parser = OptionParser("ctmigrate [load|dump|blobdiff|snap|accounts|deps|pack|unpack|owners|finish|install|profile] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [--tables=TABLES] [--cutoff=CUTOFF] [-nr]")
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
	parser.add_option("-r", "--dry_run", dest="dryrun", action="store_true",
		default=False, help="accounts/deps/pack/unpack/owners/finish/install/profile dry run")
	options, args = parser.parse_args()
	if not args:
		error("no mode specified -- must be 'ctmigrate load' or 'ctmigrate dump'")
	try:
		import model # model loads schema
	except:
		log("no model found - proceeding without schema")
	mode = args[0]
	if mode in MODES:
		if mode == "blobdiff":
			blobdiff(int(options.cutoff))
		elif mode == "snap":
			snap(options.domain)
		elif mode in ["accounts", "deps", "pack", "unpack", "owners", "finish", "install", "profile"]:
			MODES[mode](options.dryrun)
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
			"must be 'ctmigrate snap' or 'ctmigrate load' or ctmigrate dump' or ctmigrate blobdiff'")
	log("everything seems to have worked!")
	log("goodbye")

if __name__ == "__main__":
	go()