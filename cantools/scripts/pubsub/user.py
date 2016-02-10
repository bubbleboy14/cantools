from datetime import datetime
from actor import Actor

class PubSubUser(Actor):
    def __init__(self, conn, server, logger):
        self.conn = conn
        self.server = server
        self._log = logger
        self.channels = set()
        self.conn.set_cb(self._register)
        self._log('NEW CONNECTION', 1, True)

    def write(self, data):
        data["data"]["datetime"] = str(datetime.now())
        self.conn.write(data)

    def _read(self, obj):
        if obj["action"] == "close":
            return self.conn.close()
        getattr(self.server, obj["action"])(obj["data"], self)

    def _close(self):
        for channel in list(self.channels):
            channel.leave(self)
        if self.name in self.server.users:
            del self.server.users[self.name]
        elif self.name in self.server.admins:
            del self.server.admins[self.name]

    def _error(self, message):
        self.write({
            "action": "error",
            "data": {
                "message": message
            }
        })

    def _register(self, obj):
        name = obj["data"]
        self._log('REGISTER: "%s"'%(name,), 1, True)
        self.name = name
        self.server.newUser(self)
        self.conn.set_cb(self._read)
        self.conn.set_close_cb(self._close)