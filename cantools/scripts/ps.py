import json
from datetime import datetime
from dez.network.websocket import WebSocketDaemon
from ..util import log
from ..config import config

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

    def _broadcast(self, obj):
        for user in self.users:
            user.write(obj)

    def write(self, subobj):
        subobj["channel"] = self.name
        obj = {
            "action": "publish",
            "data": subobj
        }
        self._broadcast(obj)
        self.history.append(subobj)
        self.history = self.history[:config.pubsub.history]

    def leave(self, user):
        if user in self.users:
            self.users.remove(user)
            user.leave(self)
            self._broadcast({
                "action": "unsubscribe",
                "data": {
                    "user": user.name,
                    "channel": self.name
                }
            })

    def join(self, user):
        self._broadcast({
            "action": "subscribe",
            "data": {
                "user": user.name,
                "channel": self.name
            }
        })
        self.users.add(user)
        user.join(self)

class PubSubUser(object):
    def __init__(self, conn, server, logger):
        self.conn = conn
        self.server = server
        self._log = logger
        self.channels = set()
        self.conn.set_cb(self._register)
        self._log('NEW CONNECTION', 1, True)

    def join(self, channel):
        self.channels.add(channel)

    def leave(self, channel):
        if channel in self.channels:
            self.channels.remove(channel)

    def write(self, data):
        data["data"]["datetime"] = str(datetime.now()) # do a better job
        dstring = json.dumps(data) # pre-encode so we can log
        self._log('WRITE: "%s" -> "%s"'%(self.name, dstring), 3)
        self.conn.write(dstring, noEncode=True)

    def _read(self, obj):
        if obj["action"] == "close":
            return self.conn.close()
        getattr(self.server, obj["action"])(obj["data"], self)

    def _close(self):
        for channel in list(self.channels):
            channel.leave(self)
        if self.name in self.server.clients: # _should_ be
            del self.server.clients[self.name]

    def _register(self, obj):
        name = obj["data"]
        self._log('REGISTER: "%s"'%(name,), 1, True)
        self.name = name
        self.server.clients[name] = self
        self.conn.set_cb(self._read)
        self.conn.set_close_cb(self._close)