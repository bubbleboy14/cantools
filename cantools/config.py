import json, getpass
from base64 import b64encode, b64decode
from util import read, write
from cfg import cfg

class Config(object):
	def __init__(self, cfg):
		self._cfg = {}
		for key, val in cfg.items():
			self.update(key, val)

	def __getattr__(self, key):
		return self._cfg.get(key)

	def __getitem__(self, key):
		return self._cfg.get(key)

	def __contains__(self, key):
		return key in self._cfg

	def obj(self):
		obj = {}
		for k, v in self.items():
			if v.__class__ == Config:
				obj[k] = v.obj()
			else:
				obj[k] = v
		return obj

	def json(self):
		return json.dumps(self.obj(), indent=4)

	# dict compabitility
	def get(self, key, fallback=None):
		return self._cfg.get(key, fallback)

	def values(self):
		return self._cfg.values()

	def items(self):
		return self._cfg.items()

	def keys(self):
		return self._cfg.keys()

	def update(self, key, val={}):
		self._cfg[key] = isinstance(val, dict) and Config(val) or val

	def sub(self, key):
		if key not in self._cfg:
			self.update(key)
		return self._cfg.get(key)

class PCache(object):
	def __init__(self, cfg):
		self.fname = cfg
		self._cache = json.loads(b64decode(read(cfg, default="")) or "{}")

	def _save(self):
		write(b64encode(json.dumps(self._cache)), self.fname)

	def __call__(self, key, password=True, overwrite=False):
		dk = b64encode(key)
		if overwrite or dk not in self._cache:
			p = (password and getpass.getpass or raw_input)(key)
			if raw_input("store %s? [Y/n]: "%(password and "password" or "value")).lower().startswith("n"):
				return p
			self._cache[dk] = b64encode(p)
			self._save()
		return b64decode(self._cache[dk])

pc = PCache(".ctp")

def _getpass(val, ptype):
	if "{PASSWORD}" in val:
		val = val.replace("{PASSWORD}", pc("enter password (%s): "%(ptype,)))
	return val

config = Config(cfg)

def include_plugins():
	try:
		plugs = {}
		def loadp(plugin):
			if plugin not in plugs:
				mod = plugs[plugin] = __import__(plugin)
				if hasattr(mod.init, "requires"):
					for p in mod.init.requires:
						loadp(p)
				if hasattr(mod.init, "cfg"):
					config.update(plugin, mod.init.cfg)
		for plugin in config.plugin.modules:
			loadp(plugin)
	except:
		pass # plugin import error - fine if refreshing project for 1st time

config.plugin.update("modules", [])
config.plugin.update("repos", [])

items = []
for line in read("ct.cfg", True):
	if line.startswith("#"):
		continue
	key, val = [term.strip() for term in line.split(" = ")]
	if key == "PLUGIN_MODULES":
		mods = val.split("|")
		config.plugin.update("modules", map(lambda p : p.split("/")[-1], mods))
		config.plugin.update("repos", map(lambda p : "/" in p and p or "%s/%s"%(config.plugin.base, p), mods))
		include_plugins()
	else:
		items.append([key, val])

for key, val in items:
	if key in ["ENCODE", "DB_ECHO", "DB_PUBLIC", "GEO_TEST", "MEMCACHE_REQUEST", "MEMCACHE_DB", "PUBSUB_ECHO", "SSL_VERIFY", "ADMIN_MONITOR_LOG", "WEB_XORIGIN"]:
		val = val == "True"
	elif key in ["PUBSUB_HISTORY"]:
		val = int(val)
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
		if target in ["pubsub_botnames", "log_allow", "geo_user_geonames", "geo_user_google", "admin_contacts", "web_rollz", "admin_monitor_geo", "build_exclude"]:
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

config.db.update("main", config.db[config.web.server])
config.update("cache", pc)

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