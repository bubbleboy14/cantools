class HookBox(object):
	def __init__(self):
		self.hooks = []

	def __call__(self, data):
		for hook in self.hooks:
			hook(data)

	def register(self, cb):
		self.hooks.append(cb)

memhook = HookBox()
dbhook = HookBox()