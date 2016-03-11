import os, sys
from base64 import b64encode
from dez.network.websocket import WebSocketDaemon
from cantools import config
from cantools.util import log, set_log
from user import PubSubUser
from channel import PubSubChannel

class PubSub(WebSocketDaemon):
    def __init__(self, *args, **kwargs):
        if config.pubsub.log:
            set_log(config.pubsub.log and os.path.join("logs", config.pubsub.log))
        kwargs["b64"] = True
        kwargs["isJSON"] = True
        kwargs["report_cb"] = self._log
        kwargs["cb"] = self.connect
        if "silent" in kwargs:
            self.silent = kwargs["silent"]
            del kwargs["silent"]
        else:
            self.silent = False
        WebSocketDaemon.__init__(self, *args, **kwargs)
        self.bots = {}
        self.users = {}
        self.admins = {}
        self.channels = {}
        self.loadBots()
        config.admin.update("pw", config.cache("admin password? "))
        self._log("Initialized PubSub Server @ %s:%s"%(self.hostname, self.port), important=True)

    def loadBots(self):
        self._log("Loading Bots: %s"%(config.pubsub.botnames,))
        sys.path.insert(0, "bots") # for dynamically loading bot modules
        for bname in config.pubsub.botnames:
            self._log("Importing Bot: %s"%(bname,), 2)
            __import__(bname) # config modified in pubsub.bots.BotMeta.__new__()

    def newUser(self, u):
        if not u.name: # on dc?
            self._log("user disconnected without registering")
            u.conn.close()
        elif u.name.startswith("__admin__") and u.name.endswith(b64encode(config.admin.pw)):
            self.admins[u.name] = u
            self.snapshot(u)
        else:
            self.users[u.name] = u

    def client(self, name):
        return self.users.get(name) or self.bots.get(name) or self.admins.get(name)

    def snapshot(self, admin):
        admin.write({
            "action": "snapshot",
            "data": {
                "bots": [b.data() for b in self.bots.values()],
                "users": [u.data() for u in self.users.values()],
                "admins": [a.data() for a in self.admins.values()],
                "channels": [c.data() for c in self.channels.values()]
            }
        })

    def pm(self, data, user):
        recipient = self.client(data["user"])
        if not recipient:
            return user._error("no such user!")
        recipient.write({
            "action": "pm",
            "data": {
                "user": user.name,
                "message": data["message"]
            }
        })

    def subscribe(self, channel, user):
        self._check_channel(channel)
        chan = self.channels[channel]
        chan.join(user)
        self._log('SUBSCRIBE: "%s" -> "%s"'%(user.name, channel), 2)
        user.write({
            "action": "channel",
            "data": {
                "channel": channel,
                "presence": [u.name for u in chan.users],
                "history": chan.history
            }
        })

    def unsubscribe(self, channel, user):
        if self._check_channel(channel, True) and user in self.channels[channel].users:
            self.channels[channel].leave(user)
            self._log('UNSUBSCRIBE: "%s" -> "%s"'%(user.name, channel), 2)
        else:
            self._log('FAILED UNSUBSCRIBE: "%s" -> "%s"'%(user.name, channel), 2)

    def publish(self, data, user):
        channel = data["channel"]
        self._check_channel(channel)
        self.channels[channel].write({
            "message": data["message"],
            "user": user.name
        })

    def _new_channel(self, channel):
        self.channels[channel] = PubSubChannel(channel, self)
        # check for bots...
        botname = channel.split("_")[0]
        if botname in config.pubsub.bots:
            self._log("Generating Bot '%s' for channel '%s'"%(botname, channel), 2)
            config.pubsub.bots[botname](self, self.channels[channel])

    def _check_channel(self, channel, justBool=False):
        condition = channel in self.channels
        if not condition and not justBool:
            self._new_channel(channel)
        return condition

    def _log(self, data, level=0, important=False):
        if not self.silent:
            log(data, level=level, important=important)

    def connect(self, conn):
        PubSubUser(conn, self, self._log)