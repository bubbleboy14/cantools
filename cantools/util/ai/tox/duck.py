import random
from datetime import datetime

def nosay():
	return random.choice([
		"i'm confused",
		"you broke me",
		"you're killing me bro",
		"that question ruined me",
		"your words somehow fried my circuits",
		"i literally don't know how to answer that"
	])

def notyet():
	return random.choice([
		"slow down",
		"not so fast",
		"wait a minute",
		"take your time",
		"slow your roll",
		"i need a moment",
		"hold your horses"
	])

# ddg
DDGAI = {
	"bot": None,
	"last": None
}
DUX = ["gpt-4o-mini", "llama-3.3-70b", "claude-3-haiku", "o3-mini", "mistral-small-3"]
OLDUX = ["o3-mini", "gpt-4o-mini", "claude-3-haiku", "llama-3.1-70b", "mixtral-8x7b"]
delimiases = {
	"False": False,
	True: "\n",
	"True": "\n",
	"LINE": "\n",
	"PARAGRAPH": "\n",
	"SENTENCE": ".",
	"PHRASE": [".", "!", "?"]
}

def ddgai():
	if not DDGAI["bot"]:
		from duckai import DuckAI
		DDGAI["bot"] = DuckAI()
	return DDGAI["bot"]

def toosoon():
	now = datetime.now()
	if DDGAI["last"] and (now - DDGAI["last"]).seconds < 15:
		return True
	DDGAI["last"] = now

def duck(prompt, model="gpt-4o-mini", shorten=False, strip=False, timeout=30):
	if toosoon():
		return notyet()
	try:
		resp = ddgai().chat(prompt, model, int(timeout))
	except:
		resp = nosay()
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