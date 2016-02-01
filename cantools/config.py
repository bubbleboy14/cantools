from cantools.util import read
from cfg import cfg

class Config(object):
	def __init__(self, cfg):
		self._cfg = {}
		for key, val in cfg.items():
			self.update(key, val)

	def __getattr__(self, key):
		return self._cfg[key]

	def __getitem__(self, key):
		return self._cfg[key]

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

def dbupdate(dbprop, val):
	if "{PASSWORD}" in val:
		import getpass
		val = val.replace("{PASSWORD}", getpass.getpass("enter database password (%s): "%(dbprop,)))
	config.db.update(dbprop, val)

config = Config(cfg)
for key, val in [[term.strip() for term in line.split(" = ")] for line in read("ct.cfg", True)]:
	if key == "ENCODE":
		config.update("encode", val == "True")
	elif key == "JS_PATH":
		config.js.update("path", val)
	elif key == "DB":
		dbupdate(config.web_server, val)
	elif key == "DB_TEST":
		dbupdate("test", val)
	elif key == "PUBSUB_BOTS":
		def lb():
			import sys
			from cantools.util import log
			log("Loading Bots")
			sys.path.insert(0, "bots") # for dynamically loading bot modules
			for bname in config.pubsub._botNames:
				log("Importing Bot: %s"%(bname,), 2)
				__import__(bname) # config modified in pubsub.bots.BotMeta.__new__()
		config.pubsub.update("_botNames", val.split("|"))
		config.pubsub.update("loadBots", lb)
	else:
		config.update(key.lower(), val)
config.update("db_test", config.db.test)
config.update("db", config.db[config.web_server])