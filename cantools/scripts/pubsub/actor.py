class Actor(object):
    def join(self, channel):
        self.channels.add(channel)

    def leave(self, channel):
        if channel in self.channels:
            self.channels.remove(channel)

