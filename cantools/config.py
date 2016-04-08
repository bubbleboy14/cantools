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

	# dict compabitility
	def values(self):
		return self._cfg.values()

	def items(self):
		return self._cfg.items()

	def keys(self):
		return self._cfg.keys()

	def update(self, key, val):
		self._cfg[key] = isinstance(val, dict) and Config(val) or val

class PCache(object):
	def __init__(self, cfg):
		self.fname = cfg
		self._cache = json.loads(b64decode(read(cfg, default="")) or "{}")

	def _save(self):
		write(b64encode(json.dumps(self._cache)), self.fname)

	def __call__(self, key, password=True):
		dk = b64encode(key)
		if dk not in self._cache:
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
for key, val in [[term.strip() for term in line.split(" = ")] for line in read("ct.cfg", True)]:
	if key in ["ENCODE", "DB_ECHO", "DB_PUBLIC", "GEO_TEST", "CACHE_REQUEST", "CACHE_DB"]:
		val = val == "True"
	if key == "DB":
		config.db.update(config.web.server, _getpass(val, "db"))
	elif key == "DB_TEST":
		config.db.update("test", _getpass(val, "test db"))
	else:
		target = key.lower()
		c = config
		if "_" in target:
			if target in ["pubsub_botnames", "log_allow", "geo_user_geonames", "geo_user_google"]:
				val = val.split("|")
			path, target = target.rsplit("_", 1)
			for part in path.split("_"):
				c = getattr(c, part)
		c.update(target, val)

config.db.update("main", config.db[config.web.server])
config.update("cache", pc)