import datetime
from cantools.web import respond, succeed, cgi_get, getmem, setmem, delmem, clearmem, read_file, send_file, fetch
from cantools.util import token, transcode, resizep2
from cantools.hooks import memhook
from cantools import config

def prox():
	url = cgi_get("url")
	data = getmem(url, False)
	if not data:
		data = fetch(url, timeout=config.memcache.prox.timeout, fakeua=True)
		if cgi_get("p2", default=False):
			data = resizep2(data)
		setmem(url, data, False)
	send_file(data, detect=True)

def response():
	action = cgi_get("action", choices=["get", "set", "forget", "prox", "clear"])
	if action == "clear":
		if cgi_get("pw") != config.admin.pw:
			fail("wrong")
		clearmem()
		succeed()
	if action == "prox":
		return prox()
	key = cgi_get("key")
	json = cgi_get("json", default=False)
	mode = cgi_get("mode", default="normal")
	value = cgi_get("value", required=False) # set only
	countdown_list = getmem("_countdown_list", False)
	meta = cgi_get("meta", default={})
	if action == "forget":
		delmem(key)
	elif action == "get":
		data = getmem(key, json)
		if mode == "countdown":
			if key == "_countdown_list":
				succeed(list(countdown_list or set()))
			elif data:
				succeed({
					"ttl": (data["ttl"] - datetime.datetime.now()).total_seconds(),
					"token": data["token"],
					"meta": data["meta"]
				})
		elif mode == "blob":
			send_file(data, detect=True)
		succeed(data)
	elif action == "set":
		if mode == "countdown":
			cdl = countdown_list or set()
			cdl.add(key);
			setmem("_countdown_list", cdl, False)
			setmem(key, {
				"ttl": datetime.datetime.now() + datetime.timedelta(0, value),
				"token": token(),
				"meta": meta
			}, json)
		elif mode == "blob":
			value = read_file(value)
			if cgi_get("transcode", default=False):
				value = transcode(value, True)
			setmem(key, value, False) # JSON disallowed
			json = False # for memhook
		else:
			setmem(key, value, json)
	cgi_get("nohook", default=False) or memhook({ # actions: set, forget
		"action": action,
		"key": key,
		"mode": mode,
		"json": json,
		"meta": meta,
		"value": value,
		"countdown_list": countdown_list
	})

respond(response)