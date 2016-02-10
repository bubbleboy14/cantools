from util import read
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

def _getpass(val, ptype):
	import getpass
	if "{PASSWORD}" in val:
		val = val.replace("{PASSWORD}", getpass.getpass("enter password (%s): "%(ptype,)))
	return val

config = Config(cfg)
for key, val in [[term.strip() for term in line.split(" = ")] for line in read("ct.cfg", True)]:
	if key == "ENCODE":
		config.update("encode", val == "True")
	elif key == "DB":
		config.db.update(config.web.server, _getpass(val, "db"))
	elif key == "DB_TEST":
		config.db.update("test", _getpass(val, "test db"))
	elif key == "PUBSUB_BOTS":
		config.pubsub.update("botnames", val.split("|"))
	else:
		target = key.lower()
		c = config
		if "_" in target:
			path, target = target.rsplit("_", 1)
			for part in path.split("_"):
				c = getattr(c, part)
		c.update(target, val)
config.update("db_test", config.db.test)
config.update("db", config.db[config.web.server])