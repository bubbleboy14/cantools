import datetime, json, os
from cantools import config
from cantools.util import log, write
from cantools.web import fetch, send_mail
from actor import Actor
try:
	import psutil
except ImportError, e:
	pass # google crap engine (get it if you need it!)

class BotMeta(type):
	def __new__(cls, name, bases, attrs):
		bc = type.__new__(cls, name, bases, attrs)
		if name is not "Bot":
			name is not "Monitor" and log("Initializing Bot Class: %s"%(name,), important=True)
			config.pubsub.bots.update(name.lower(), bc)
		return bc

class Bot(Actor):
	num = 0
	__metaclass__ = BotMeta
	def __init__(self, server, channel, name=None):
		Bot.num += 1
		self.name = name or (self.__class__.__name__ + str(Bot.num))
		self.server = server
		self.channel = channel # often we only care about one channel
		self.channels = set()
		self._set_defaults()
		log("Bot Spawned: '%s'"%(self.name,), 2)
		channel.join(self)
		self.server.bots[self.name] = self

	def pub(self, message):
		self.server.publish({
			"message": message,
			"channel": self.channel.name
		}, self)

	def write(self, obj): # receive message from channel
		getattr(self, "on_%s"%(obj["action"],))(obj["data"])

	def _default_handler(self, action):
		def _h(*args):
			log('Bot %s handling %s: "%s"'%(self.name, action, json.dumps(args)), 3)
		return _h

	def _set_defaults(self):
		for action in ["channel", "publish", "subscribe", "unsubscribe", "pm", "error", "meta"]:
			hname = "on_%s"%(action,)
			if not hasattr(self, hname):
				setattr(self, hname, self._default_handler(action))

class Monitor(Bot):
	def __init__(self, server, channel, name="monitor"): # only one monitor
		import event # here for google crap engine
		self.current = {}
		self.alert = {}
		Bot.__init__(self, server, channel, name)
		event.timeout(config.admin.monitor.interval, self._tick)

	def _datedir(self):
		n = datetime.datetime.now()
		lp = os.path.join("logs", "monitor")
		yp = os.path.join(lp, str(n.year))
		mp = os.path.join(yp, str(n.month))
		dp = os.path.join(mp, str(n.day))
		if not os.path.isdir(lp):
			os.mkdir(lp)
		if not os.path.isdir(yp):
			os.mkdir(yp)
		if not os.path.isdir(mp):
			os.mkdir(mp)
		if not os.path.isdir(dp):
			os.mkdir(dp)
		return os.path.join(dp, str(n.hour))

	def log(self, data):
		self.pub(data)
		if config.admin.monitor.log:
			write(data, self._datedir(), True, append=True, newline=True)

	def _cpu(self):
		c = self.current["cpu"] = psutil.cpu_percent()
		if self.alert.get("cpu"):
			if c < config.admin.monitor.thresholds.cpu:
				del self.alert["cpu"]
				log("CPU calmed down")
				send_mail(config.admin.contacts, subject="High CPU", body="just ended")
		else:
			if c >= config.admin.monitor.thresholds.cpu:
				self.alert["cpu"] = True
				log("CPU just started going crazy")
				send_mail(config.admin.contacts, subject="High CPU", body="just started")

	def _tick(self):
		self._cpu()
		dioc = psutil.disk_io_counters()
		nioc = psutil.net_io_counters()
		dmon = fetch(config.admin.host, "/_report",
			config.admin.port, True, protocol=config.admin.protocol)
		data = {
			"gc": dmon["gc"],
			"cpu": self.current["cpu"],
			"read": dioc.read_time,
			"write": dioc.write_time,
			"sent": nioc.bytes_sent,
			"recv": nioc.bytes_recv,
			"process_memory": dmon["mem"],
			"virtual_memory": psutil.virtual_memory().percent,
			"swap_memory": psutil.swap_memory().percent,
			"connections": len(psutil.net_connections()),
			"web_connections": dmon["web"]["connections"],
			"admin_connections": dmon["admin"]["connections"],
			"web_requests": dmon["web"]["requests"],
			"admin_requests": dmon["admin"]["requests"],
			"totals": {
				"web": {
					"connections": dmon["web"]["total_connections"],
					"requests": dmon["web"]["total_requests"],
					"rolls": dmon["web"]["rolls"]
				},
				"admin": {
					"connections": dmon["admin"]["total_connections"],
					"requests": dmon["admin"]["total_requests"],
					"rolls": dmon["admin"]["rolls"]
				}
			},
			"devices": {
				"web": dmon["web"]["devices"],
				"admin": dmon["admin"]["devices"]
			},
			"ips": {
				"web": dmon["web"]["ips"],
				"admin": dmon["admin"]["ips"]
			}
		}
		if config.admin.monitor.proxy:
			data["ips"]["proxy"] = fetch(config.admin.host, "/_report",
				config.admin.monitor.proxy, True)["ips"]
		self.log(data)
		return True