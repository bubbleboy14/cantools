from cantools.web import respond, succeed, fail, cgi_get, getcache, clearmem
from cantools import config

def response():
	action = cgi_get("action", choices=["db", "memcache", "mcclear", "monitor", "pubsub"])
	if cgi_get("pw") != config.admin.pw:
		fail("wrong");
	if action == "memcache":
		succeed(getcache())
	elif action == "mcclear":
		clearmem()
		succeed()
	elif action in ["pubsub", "monitor"]:
		succeed({ "host": config.pubsub.host, "port": config.pubsub.port })

respond(response)