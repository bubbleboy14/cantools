from cantools.web import respond, succeed, fail, cgi_get, getcache
from cantools.db import get, get_schema, get_page, edit
from cantools import config

def response():
	action = cgi_get("action", choices=["db", "memcache", "pubsub"])
	if cgi_get("pw") != config.admin.pw:
		fail("wrong");
	if action == "db":
		key = cgi_get("key", required=False)
		if key:
			if key == "edit":
				succeed({ "key": edit(cgi_get("data")).urlsafe() })
			succeed(get(key).data())
		import model # load up all models
		mname = cgi_get("modelName", required=False)
		if mname:
			succeed(get_page(mname, cgi_get("limit"), cgi_get("offset")))
		succeed(get_schema())
	elif action == "memcache":
		succeed(getcache())
	elif action == "pubsub":
		succeed({ "host": config.pubsub.host, "port": config.pubsub.port })

respond(response)