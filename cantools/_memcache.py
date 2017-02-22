import datetime
from cantools.web import respond, succeed, cgi_get, getmem, setmem, delmem
from cantools.util import token

def response():
	action = cgi_get("action", choices=["get", "set", "forget"])
	key = cgi_get("key")
	json = cgi_get("json", default=False)
	countdown = cgi_get("countdown", default=False)
	if action == "forget":
		delmem(key)
	elif action == "get":
		data = getmem(key, json)
		if countdown and data:
			succeed({
				"ttl": (data["ttl"] - datetime.datetime.now()).total_seconds(),
				"token": data["token"]
			})
		succeed(data)
	elif action == "set":
		value = cgi_get("value")
		if countdown:
			setmem(key, {
				"ttl": datetime.datetime.now() + datetime.timedelta(0, value),
				"token": token()
			}, json)
		else:
			setmem(key, value, json)

respond(response)