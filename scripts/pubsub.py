import json
from dez.network.websocket import WebSocketDaemon
from util import log
from config import PUBSUB_PORT, PUBSUB_HIST

class PubSub(WebSocketDaemon):
    def __init__(self, *args, **kwargs):
        kwargs["isJSON"] = True
        kwargs["report_cb"] = self._log
        kwargs["cb"] = self.connect
        if "silent" in kwargs:
            self.silent = kwargs["silent"]
            del kwargs["silent"]
        else:
            self.silent = False
        WebSocketDaemon.__init__(self, *args, **kwargs)
        self.clients = {}
        self.channels = {}
        log("Initialized PubSub Server @ %s:%s"%(self.hostname, self.port), important=True)

    def subscribe(self, channel, user):
        self._check_channel(channel)
        chan = self.channels[channel]
        chan.join(user)
        self._log('SUBSCRIBE: "%s" -> "%s"'%(user.name, channel), 2)
        user.write({
            "action": "channel",
            "data": {
                "channel": channel,
                "users": [u.name for u in chan.users],
                "history": chan.history
            }
        })

    def unsubscribe(self, channel, user):
        if self._check_channel(channel, True) and user in self.channels[channel].users:
            self.channels[channel].users.remove(user)
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

    def _check_channel(self, channel, justBool=False):
        condition = channel in self.channels
        if not condition and not justBool:
            self.channels[channel] = PubSubChannel(channel, self._log)
        return condition

    def _log(self, data, level=0, important=False):
        if not self.silent:
            log(data, level=level, important=important)

    def connect(self, conn):
        PubSubUser(conn, self, self._log)

class PubSubChannel(object):
    def __init__(self, name, logger):
        self._log = logger
        self.name = name
        self.users = set()
        self.history = []
        self._log('NEW CHANNEL: "%s"'%(name,), 1, True)

    def write(self, obj):
        obj["channel"] = self.name
        dstring = json.dumps({
            "action": "publish",
            "data": obj
        })
        for user in self.users:
            user.conn.write(dstring, noEncode=True) # skips logging
        self.history.append(obj)
        self.history = self.history[:PUBSUB_HIST]

    def join(self, user):
        dstring = json.dumps({
            "action": "subscribe",
            "data": {
                "user": user.name,
                "channel": self.name
            }
        })
        for user in self.users:
            user.conn.write(dstring, noEncode=True) # skips logging
        self.users.add(user)

class PubSubUser(object):
    def __init__(self, conn, server, logger):
        self.conn = conn
        self.server = server
        self._log = logger
        self.conn.set_cb(self._register)
        self._log('NEW CONNECTION', 1, True)

    def write(self, data):
        dstring = json.dumps(data) # pre-encode so we can log
        self._log('WRITE: "%s" -> "%s"'%(self.name, dstring), 3)
        self.conn.write(dstring, noEncode=True)

    def _read(self, obj):
        getattr(self.server, obj["action"])(obj["data"], self)

    def _register(self, name):
        self._log('REGISTER: "%s"'%(name,), 1, True)
        self.name = name
        self.server.clients[name] = self
        self.conn.set_cb(self._read)

if __name__ == "__main__":
    PubSub('localhost', PUBSUB_PORT).start()