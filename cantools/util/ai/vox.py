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