from .tox import tox, g4chat, g4image, fzn, duck, pb
from .vox import vox, kvoices

def tellme(prompt, voice="random", identity="gpt-4o-mini", filename="tts", unsaid=False, silent=False):
	print("tellme(%s, %s, %s)"%(voice, identity, filename), prompt)
	resp = tox(prompt, identity)
	unsaid or vox(resp, voice, filename=filename, say=not silent)
	return resp