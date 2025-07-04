# aiio
afcfg = {
	"host": "ai.fzn.party",
	"path": "_respond",
	"proto": "https"
}

def fzn(statement, identity="Anonymous", name=None, mood=None, asker=None, options=None):
	from cantools.web import post
	params = {
		"identity": identity,
		"statement": statement,
		"options": options,
		"mood": mood,
		"name": name,
		"asker": asker
	}
	fu = "%s://%s/%s"%(afcfg["proto"], afcfg["host"], afcfg["path"])
	print("fzn", fu, params)
	resp = post(fu, data=params, ctjson=True)
	print(resp)
	return resp