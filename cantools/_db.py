from cantools.web import respond, succeed, fail, cgi_get, cgi_dump, getmem, setmem, clearmem
from cantools.db import get, get_model, get_schema, get_page, get_multi, put_multi, edit, dprep, admin
from cantools import config
import model # load up all models (for schema)

def response():
	action = cgi_get("action", choices=["schema", "get", "edit", "delete", "put", "index"])

	# edit/delete/put/index always require credentials; getters do configurably
	if not config.db.public or action in ["edit", "delete", "put", "index"]:
		if cgi_get("pw") != config.admin.pw:
			fail("wrong")

	if action == "schema":
		succeed(get_schema())
	elif action == "get":
		sig = cgi_dump()
		# gae web cache disabled for now ... seems messed up
		res = config.web.server == "dez" and getmem(sig, False) or None
		if not res:
			mname = cgi_get("modelName", required=False)
			keys = cgi_get("keys", required=False)
			if mname:
				order = cgi_get("order", default="index")
				if config.web.server == "gae":
					order = getattr(get_model(mname), order)
				res = get_page(mname, int(cgi_get("limit")), int(cgi_get("offset")),
					order, cgi_get("filters", default={}))
			elif keys:
				res = [d.export() for d in get_multi(keys)]
			else:
				res = get(cgi_get("key")).export()
			if config.memcache.db and config.web.server == "dez":
				setmem(sig, res, False)
		succeed(res)
	elif action == "edit":
		if config.memcache.db:
			clearmem()
		succeed(edit(cgi_get("data")).data())
	elif action == "put":
		put_multi([get_model(d["modelName"])(**dprep(d)) for d in cgi_get("data")])
	elif action == "delete":
		get(cgi_get("key")).rm()
	elif action == "index":
		admin.index(cgi_get("kind", default="*"))

respond(response)