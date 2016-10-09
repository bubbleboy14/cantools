from cantools.web import respond, succeed, cgi_get, getmem, setmem

def response():
	action = cgi_get("action", choices=["get", "set"])
	key = cgi_get("key")
	json = cgi_get("json", default=False)
	if action == "get":
		succeed(getmem(key, json))
	setmem(key, cgi_get("value"), json)

respond(response)