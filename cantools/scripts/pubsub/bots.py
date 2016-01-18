import json
from cantools import config
from cantools.util import log
from actor import Actor

class BotMeta(type):
	def __new__(cls, name, bases, attrs):
		bc = type.__new__(cls, name, bases, attrs)
		if name is not "Bot":
			log("Initializing Bot Class: %s"%(name,), important=True)
			config.pubsub.bots.update(name.lower(), bc)
		return bc

class Bot(Actor):
	num = 0
	__metaclass__ = BotMeta
	def __init__(self, server, channel, name=None):
		Bot.num += 1
		self.name = name or (self.__class__.__name__ + str(Bot.num))
		self.server = server
		self.channels = set()
		self._set_defaults()
		log("Bot Spawned: '%s'"%(self.name,), 2)
		channel.join(self)
		self.server.bots[self.name] = self

	def write(self, obj): # receive message from channel
		getattr(self, "on_%s"%(obj["action"],))(obj["data"])

	def _default_handler(self, action):
		def _h(*args):
			log('Bot %s handling %s: "%s"'%(self.name, action, json.dumps(args)), 3)
		return _h

	def _set_defaults(self):
		for action in ["channel", "publish", "subscribe", "unsubscribe", "pm", "error"]:
			hname = "on_%s"%(action,)
			if not hasattr(self, hname):
				setattr(self, hname, self._default_handler(action))