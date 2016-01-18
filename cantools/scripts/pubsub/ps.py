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

    def pm(self, data, user):
        recipient = data["user"]
        if recipient not in self.users and recipient not in self.bots:
            return self._error(user, "no such user!")
        self.users.get(recipient, self.bots[recipient]).write({
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

    def _error(self, user, message):
        user.write({
            "action": "error",
            "data": {
                "message": message
            }
        })

    def _new_channel(self, channel):
        self.channels[channel] = PubSubChannel(channel, self._log)
        gametype = channel.split("_")[0]
        if gametype in config.pubsub.bots:
            self._log("Generating Bot '%s' for channel '%s'"%(gametype, channel), 2)
            self.bots[channel] = config.pubsub.bots[gametype](self, self.channels[channel])

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