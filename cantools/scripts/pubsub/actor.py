class Actor(object):
    def data(self):
        return {
            "name": self.name,
            "channels": [c.name for c in self.channels]
        }

    def join(self, channel):
        self.channels.add(channel)

    def leave(self, channel):
        if channel in self.channels:
            self.channels.remove(channel)