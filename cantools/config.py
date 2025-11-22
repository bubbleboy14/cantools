import os
from fyg import Config, PCache, config as confyg
from databae import config as dbcfg
from fyg.util import read
from .cfg import cfg

pc = PCache(".ctp")

def _getpass(val, ptype):
	if "{PASSWORD}" in val:
		val = val.replace("{PASSWORD}", pc("enter password (%s): "%(ptype,)))
	return val

config = Config(cfg)

def include_plugins():
	plugs = {}
	def loadp(plugin):
		plugin = plugin.split("/")[-1]
		if plugin not in plugs:
			try:
				mod = plugs[plugin] = __import__(plugin)
			except:
				print("missing plugin: %s (fine if refreshing project for 1st time)"%(plugin,))
				return
			if hasattr(mod.init, "requires"):
				for p in mod.init.requires:
					loadp(p)
			if hasattr(mod.init, "cfg"):
				config.update(plugin, mod.init.cfg)
	for plugin in config.plugin.modules:
		loadp(plugin)

config.plugin.update("modules", [])
config.plugin.update("repos", [])

items = []
lines = read("ct.cfg", True)
gcpath = os.path.join(os.path.expanduser("~"), "ct.cfg")
if os.path.isfile(gcpath):
	print("loading global configuration at: %s"%(gcpath,))
	lines = read(gcpath, True) + lines
for line in lines:
	if line.startswith("#"):
		continue
	try:
		key, val = [term.strip() for term in line.split(" = ", 1)]
	except Exception as e:
		print("failed to parse config on line:", line)
		raise e
	if key == "PLUGIN_MODULES":
		mods = val.split("|")
		config.plugin.update("modules", [p.split("/")[-1] for p in mods])
		config.plugin.update("repos", ["/" in p and p or "%s/%s"%(config.plugin.base, p) for p in mods])
		include_plugins()
	else:
		items.append([key, val])

for key, val in items:
	if key in ["ENCODE", "DB_ECHO", "DB_PUBLIC", "DB_REFCOUNT", "DB_CACHE", "DB_JSONTEXT", "DB_ARRAYTEXT", "DB_NOPOLY", "DB_POOL_NULL", "DB_INDEX_KEYS", "DB_INDEX_NAMED", "PROXY_ACTIVE", "GEO_TEST", "REL_VERBOSE", "REL_LOUDLISTEN", "MEMCACHE_REQUEST", "MEMCACHE_DB", "PUBSUB_ECHO", "PUBSUB_META", "PUBSUB_B64", "SSL_VERIFY", "ADMIN_MONITOR_LOG", "WEB_DEBUG", "WEB_XORIGIN", "LOG_TIMESTAMP", "BUILD_PROD_CLOSURE", "BUILD_PROD_B64", "GMAILER", "MAILHTML", "MAILOUD"]:
		val = val == "True"
	elif key in ["PUBSUB_HISTORY", "MEMPAD", "WEB_SHIELD_CHUNK", "WEB_SHIELD_LIMIT", "WEB_SHIELD_INTERVAL", "PROXY_MINPORT", "PROXY_MAXPORT", "MEMCACHE_PROX_TIMEOUT", "DB_POOL_SIZE", "DB_POOL_OVERFLOW", "DB_POOL_RECYCLE", "DB_STRINGSIZE", "DB_FLATKEYSIZE", "LOG_OPENFILES", "LOG_TRACEMALLOC", "MAILSCANTICK"]:
		val = int(val)
	elif key in ["REL_SLEEP", "REL_TURBO"]:
		val = float(val)
	if key == "DB":
		config.db.update(config.web.server, _getpass(val, "db"))
	elif key == "DB_TEST":
		config.db.update("test", _getpass(val, "test db"))
	elif key == "ADMINPWGAE":
		# this property only exists for local finagling of a gae database (datastore).
		# this is _not_ for production and frankly should _not_ even be committed to
		# a repository. use with care!
		config.admin.update("pw", val)
	else:
		if key == "SCRAMBLER":
			config.update("customscrambler", True)
		target = key.lower()
		c = config
		if target in ["pubsub_botnames", "log_allow", "geo_user_geonames", "geo_user_google", "admin_contacts", "admin_reportees", "web_rollz", "admin_monitor_geo", "build_dependencies", "build_exclude", "build_include", "build_notjs", "web_whitelist", "admin_whitelist", "web_blacklist", "web_eflags"]: # TODO: use default list detection instead
			val = val.split("|")
			if target == "web_rollz":
				rollz = {}
				for v in val:
					flag, domain = v.split(":")
					rollz[flag] = domain
				val = rollz
		if "_" in target:
			path, target = target.rsplit("_", 1)
			for part in path.split("_"):
				c = c.sub(part)
		c.update(target, val)

config.update("cache", pc)
if not config.db.main:
	config.db.update("main", config.db[config.web.server])
if "DBPW" in config.db.main:
	config.db.update("main", config.db.main.replace("DBPW", config.cache("database password? ")))
for prop in ["deep", "flush", "timestamp", "allow"]:
	confyg.log.update(prop, config.log[prop])
for prop in ["cache", "refcount", "main", "test", "blob", "alter", "echo", "jsontext", "arraytext", "stringsize", "flatkeysize"]:
	dbcfg.update(prop, config.db[prop])
for prop in ["key", "named"]:
	dbcfg.index.update(prop, config.db.index[prop])
for prop in ["null", "size", "recycle", "overflow"]:
	dbcfg.pool.update(prop, config.db.pool[prop])

# set protocol based on certs
if config.ssl.certfile:
	config.web.update("protocol", "https")
	config.admin.update("protocol", "https")

# extract mailer name from MAILER
if config.mailer and " <" in config.mailer:
	mn, m = config.mailer[:-1].split(" <")
	config.update("mailer", m)
	config.update("mailername", mn)

def mod_and_repo(plug):
	repo = "/" in plug and plug or "%s/%s"%(config.plugin.base, plug)
	if repo == plug:
		plug = plug.split("/")[1]
	return plug, repo

def mods_and_repos(plugs):
	mz, rz = [], [] # slicker way to do this?
	for plug in plugs:
		m, r = mod_and_repo(plug)
		mz.append(m)
		rz.append(r)
	return mz, rz

def include_plugin(plug):
	mod, repo = mod_and_repo(plug)
	config.plugin.repos.append(repo)
	config.plugin.modules.append(mod)