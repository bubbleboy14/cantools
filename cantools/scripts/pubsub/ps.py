from dez.network.websocket import WebSocketDaemon
from cantools import config
from cantools.util import log
from user import PubSubUser
from channel import PubSubChannel

class PubSub(WebSocketDaemon):
    def __init__(self, *args, **kwargs):
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
        self.channels = {}
        config.pubsub.loadBots()
        self._log("Initialized PubSub Server @ %s:%s"%(self.hostname, self.port), important=True)

    def _client(self, name):
        return self.users.get(name) or self.bots.get(name)

    def pm(self, data, user):
        recipient = self._client(data["user"])
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
        self.channels[channel] = PubSubChannel(channel, self._log)
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