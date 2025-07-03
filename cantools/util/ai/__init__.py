from .tox import tox
from .vox import vox, kvoices

def tellme(prompt, voice="random", model="o3-mini", filename="tts", full=False, unstripped=False, unsaid=False, silent=False):
	print("tellme(%s, %s, %s)"%(voice, model, filename), prompt)
	resp = tox(prompt, model, not full, not unstripped)
	print(resp)
	unsaid or vox(resp, voice, filename=filename, say=not silent)
	return resp