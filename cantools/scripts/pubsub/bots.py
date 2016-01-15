from cantools import config
from cantools.util import log

class BotMeta(type):
	def __new__(cls, name, bases, attrs):
		bc = type.__new__(cls, name, bases, attrs)
		if name is not "Bot":
			log("Initializing Bot Class: %s"%(name,), important=True)
			config.pubsub.bots.update(name, bc)
		return bc

class Bot(object):
	__metaclass__ = BotMeta
	def __init__(self, pubsub):
		self.pubsub = pubsub
		self.name = self.__class__.__name__
		log("Bot Spawned: %s"%(self.name,), 2)