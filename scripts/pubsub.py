import json
from dez.network.websocket import WebSocketDaemon
from util import log
from config import PUBSUB_PORT

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

    def subscribe(self, channel, conn):
        self._check_channel(channel)
        self.channels[channel].users.add(conn)
        self._log('SUBSCRIBE: "%s" -> "%s"'%(conn.client_id, channel), 2)
        conn.write({
            "users": [c.client_id for c in self.channels[channel]]
        })

    def unsubscribe(self, channel, conn):
        if self._check_channel(channel, True) and conn in self.channels[channel].users:
            self.channels[channel].users.remove(conn)
            self._log('UNSUBSCRIBE: "%s" -> "%s"'%(conn.client_id, channel), 2)
        else:
            self._log('FAILED UNSUBSCRIBE: "%s" -> "%s"'%(conn.client_id, channel), 2)

    def publish(self, data, conn):
        channel = data["channel"]
        message = json.dumps({
            "message": data["message"],
            "sender": conn.client_id
        })
        self._check_channel(channel)
        for c in self.channels[channel].users:
            c.conn.write(message, noEncode=True) # skips logging

    def _check_channel(self, channel, justBool=False):
        condition = channel in self.channels
        if not condition and not justBool:
            self.channels[channel] = PubSubChannel(channel, self._log)
        return condition

    def _log(self, data, level=0, important=False):
        if not self.silent:
            log(data, level=level, important=important)

    def connect(self, conn):
        PubSubConn(conn, self, self._log)

class PubSubChannel(object):
    def __init__(self, name, logger):
        self._log = logger
        self.name = name
        self.users = set()
        self._log('NEW CHANNEL: "%s"'%(channel,), 1, True)

class PubSubConn(object):
    def __init__(self, conn, server, logger):
        self.conn = conn
        self.server = server
        self._log = logger
        self.conn.set_cb(self._register)
        self._log('NEW CONNECTION', 1, True)

    def write(self, data):
        dstring = json.dumps(data) # pre-encode so we can log
        self._log('WRITE: "%s" -> "%s"'%(self.client_id, dstring), 3)
        self.conn.write(dstring, noEncode=True)

    def _read(self, obj):
        getattr(self.server, obj["action"])(obj["data"], self)

    def _register(self, client_id):
        self._log('REGISTER: "%s"'%(client_id,), 1, True)
        self.client_id = client_id
        self.server.clients[client_id] = self
        self.conn.set_cb(self._read)

if __name__ == "__main__":
    PubSub('localhost', PUBSUB_PORT).start()