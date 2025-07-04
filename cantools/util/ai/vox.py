import random
from ..system import cmd

class Kvox(object):
	def __init__(self, log=print):
		self.logger = log
		self.kpipes = {}

	def log(self, *msg):
		self.logger("Kvox", *msg)

	def getpipe(self, lang_code):
		from kokoro import KPipeline
		if lang_code not in self.kpipes:
			self.kpipes[lang_code] = KPipeline(lang_code=lang_code)
		return self.kpipes[lang_code]

	def vi(self, t, v):
		t = round(t)
		self.log("viseme with time", t, "and value", v)
		return { "time": t, "value": v }

	def token2visemes(self, token, visemes):
		self.log("token2visemes", token.text, token.phonemes, token.start_ts, token.end_ts)
		phos = token.text # phonemes are full of unicode....
		step = 1000 * (token.end_ts - token.start_ts) / len(phos)
		t = 1000 * token.start_ts
		for pho in phos:
			visemes.append(self.vi(t, pho))
			t += step
		return t

	def tokens2visemes(self, tokens):
		self.log("tokens2visemes")
		t = 0
		visemes = []
		for token in tokens:
			t = self.token2visemes(token, visemes)
		visemes.append(self.vi(t, "sil"))
		return visemes

	def __call__(self, text, voice="af_heart", speed=1, lang_code='a', filename="tts"):
		import json, soundfile
		pipeline = self.getpipe(lang_code)
		nothing, tokens = pipeline.g2p(text)
		for result in pipeline.generate_from_tokens(tokens=tokens, voice=voice, speed=float(speed)):
			self.log(result.phonemes)
			vz = self.tokens2visemes(result.tokens)
			vname = "%s.json"%(filename,)
			aname = "%s.mp3"%(filename,)
			self.log("writing", vname)
			with open(vname, "w") as f:
				f.write("%s\n"%("\n".join([json.dumps(v) for v in vz]),))
			self.log("writing", aname)
			soundfile.write(aname, result.audio, 24000)

VAGENT = None
kvox = Kvox()
kvoices = [
	"af_heart", "af_bella", "af_nicole", "af_aoede", "af_kore", "af_sarah", "af_nova",
	"af_sky", "af_alloy", "af_jessica", "af_river", "am_michael", "am_fenrir", "am_puck",
	"am_echo", "am_eric", "am_liam", "am_onyx", "am_santa", "am_adam", "bf_emma",
	"bf_isabella", "bf_alice", "bf_lily", "bm_george", "bm_fable", "bm_lewis", "bm_daniel"
]

def vagent():
	global VAGENT
	if not VAGENT:
		from venvr import getagent
		VAGENT = getagent("kovo", ["kokoro", "soundfile"])
		VAGENT.register(Kvox)
	return VAGENT

def vox(text, voice="af_heart", speed=1, lang_code='a', filename="tts", say=False):
	if voice == "random":
		voice = random.choice(kvoices)
	try:
		import kokoro
		print("found kokoro")
		kvox(text, voice, speed, lang_code, filename)
	except:
		print("no kokoro - using venvr")
		vagent().run("Kvox", text, voice, speed, lang_code, filename)
	say and cmd("mplayer %s.mp3"%(filename,))