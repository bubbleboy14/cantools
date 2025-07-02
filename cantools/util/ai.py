DDGS = None
delimiases = {
	"False": False,
	True: "\n",
	"True": "\n",
	"LINE": "\n",
	"PARAGRAPH": "\n",
	"SENTENCE": ".",
	"PHRASE": [".", "!", "?"]
}
def ddgs():
	global DDGS
	if not DDGS:
		import duckduckgo_search
		DDGS = duckduckgo_search.DDGS()
	return DDGS

def tox(prompt, model="o3-mini", shorten=False, strip=False, timeout=30):
	try:
		resp = ddgs().chat(prompt, model, int(timeout))
	except:
		resp = random.choice([
			"i'm confused",
			"you broke me",
			"you're killing me bro",
			"that question ruined me",
			"your words somehow fried my circuits",
			"i literally don't know how to answer that"
		])
	print(resp)
	if shorten in delimiases:
		shorten = delimiases[shorten]
	if shorten:
		if type(shorten) is not list:
			shorten = [shorten]
		for sho in shorten:
			resp = resp.split(sho).pop(0)
		print("shortened to:")
		print(resp)
	if strip:
		resp = resp.replace("\n", " ").replace(" & ", " and ")
		while " <" in resp and "> " in resp:
			resp = resp[:resp.index(" <") + 1] + resp[resp.index("> ") + 1:]
		while "```" in resp:
			start = resp.index("```") + 3
			resp = resp[:start] + resp[resp.index("```", start) + 3:]
		print("stripped to:")
		print(resp)
	return resp

KPZ = {}
VAGENT = None

def vagent():
	global VAGENT
	if not VAGENT:
		from venvr import getagent
		VAGENT = getagent("kovo", ["kokoro", "soundfile"])
		VAGENT.register(kvox)
	return VAGENT

def kvox(text, voice="af_heart", speed=1, lang_code='a', filename="tts", filetype="wav", kcache={}):
	from kokoro import KPipeline
	import soundfile as sf
	if lang_code not in kcache:
		kcache[lang_code] = KPipeline(lang_code=lang_code)
	pipeline = kcache[lang_code]
	generator = pipeline(text, voice=voice, speed=int(speed))
	for i, (gs, ps, audio) in enumerate(generator):
		print(i, gs, ps)
		sf.write("%s%s.%s"%(filename, i, filetype), audio, 24000)

def vox(text, voice="af_heart", speed=1, lang_code='a', filename="tts", filetype="wav"):
	try:
		import kokoro
		print("found kokoro")
		kvox(text, voice, speed, lang_code, filename, filetype, KPZ)
	except:
		print("no kokoro - using venvr")
		vagent().run("kvox", text, voice, speed, lang_code, filename, filetype)