from cantools import config

def diffmerge(orig, diff): # move this somewhere else....
    for k, v in diff.items():
        if type(v) == dict:
            if k not in orig:
                orig[k] = {}
            diffmerge(orig[k], v)
        else:
            orig[k] = v

class PubSubChannel(object):
    def __init__(self, name, server):
        self._log = server._log
        self.server = server
        self.name = name
        self.users = set()
        self.history = []
        self.metadata = {}
        self._log('NEW CHANNEL: "%s"'%(name,), 1, True)

    def data(self):
        return {
            "name": self.name,
            "users": [u.name for u in self.users]
        }

    def _broadcast(self, obj):
        for user in self.users:
            if config.pubsub.echo or user.name != obj["data"]["user"]:
                user.write(obj)
        for user in list(self.server.admins.values()):
            user.write(obj)

    def meta(self, subobj):
        subobj["channel"] = self.name
        self._broadcast({
            "action": "meta",
            "data": subobj
        })

    def chmeta(self, subobj):
        subobj["channel"] = self.name # _usually_ unnecessary
        diffmerge(self.metadata, subobj["meta"])
#        self.metadata = subobj["meta"]
        self._broadcast({
            "action": "chmeta",
            "data": subobj
        })

    def write(self, subobj):
        subobj["channel"] = self.name
        obj = {
            "action": "publish",
            "data": subobj
        }
        self._broadcast(obj)
        self.history.append(subobj)
        self.history = self.history[-config.pubsub.history:]

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
        data = {
            "user": user.name,
            "channel": self.name
        }
        if config.pubsub.meta:
            data["meta"] = user.meta
        self._broadcast({
            "action": "subscribe",
            "data": data
        })
        self.users.add(user)
        user.join(self)