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
				ent = edit(cgi_get("data"))
				succeed({ "key": ent.id(), "label": ent.label() })
			elif key == "delete":
				get(cgi_get("data")).rm()
				succeed()
			succeed(get(key).data())
		import model # load up all models
		mname = cgi_get("modelName", required=False)
		if mname:
			succeed(get_page(mname, cgi_get("limit"), cgi_get("offset"),
				cgi_get("order", default="index"),
				cgi_get("filters", default=[])))
		succeed(get_schema())
	elif action == "memcache":
		succeed(getcache())
	elif action == "pubsub":
		succeed({ "host": config.pubsub.host, "port": config.pubsub.port })

respond(response)