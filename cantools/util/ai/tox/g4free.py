
class G4F(object):
	def __init__(self, log=print):
		self.logger = log
		self.client = None

	def log(self, *msg):
		self.logger("G4F", *msg)

	def getClient(self):
		if not self.client:
			self.log("setting up client")
			from g4f.client import Client
			self.client = Client()
		return self.client

	def chat(self, prompt, model="gpt-4o-mini", short=True):
		self.log("chat(%s)"%(model,), prompt)
		messages = [{ "role": "user", "content": prompt }]
		short and messages.insert(0, {
			"role": "user",
			"content": "one sentence responses please"
		})
		return self.getClient().chat.completions.create(
			model=model,
			messages=messages
		).choices[0].message.content

	def image(self, prompt, model="flux"):
		self.log("image(%s)"%(model,), prompt)
		return self.getClient().images.generate(
			model=model,
			prompt=prompt,
			response_format="url"
		).data[0].url

	def __call__(self, action, prompt, model):
		self.log("calling", action, "with", model, ":", prompt)
		resp = getattr(self, action)(prompt, model)
		self.log("got", resp)
		return resp

gchatters = ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "deepseek-v3"]
gimagers = ["flux", "dalle-3", "gpt-image"]
VAGENT = None
g4fer = G4F()

def vagent():
	global VAGENT
	if not VAGENT:
		from venvr import getagent
		VAGENT = getagent("g4f", [{
			"requirements": "requirements-slim.txt",
			"git": "xtekky/gpt4free",
			"sym": "g4f"
		}])
		VAGENT.register(G4F)
	return VAGENT

def g4do(action, prompt, model):
	try:
		import g4f
		print("found g4f")
		return g4fer(action, prompt, model)
	except:
		print("no g4f - using venvr")
		return vagent().run("G4F", action, prompt, model)

def g4image(prompt, model="flux"):
	return g4do("image", prompt, model)

def g4chat(prompt, model="gpt-4o-mini"):
	return g4do("chat", prompt, model)