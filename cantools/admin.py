from cantools.web import respond, success, fail, cgi_get, getcache
from cantools.db import get_model
from cantools import config

def response():
	action = cgi_get("action", choices=["db", "memcache", "pubsub"])
	if cgi_get("pw") != config.admin:
		fail("wrong");
	if action == "db":
		mod = get_model(cgi_get("modelName"))
		limit = cgi_get("limit")
		offset = cgi_get("offset")
		succeed([d.data() for d in mod.query().fetch(limit, offset)])
	elif action == "memcache":
		succeed(getcache())
	elif action == "pubsub":
		succeed({ "host": config.pubsub.host, "port": config.pubsub.port })

respond(response)