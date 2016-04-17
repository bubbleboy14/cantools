from cantools.web import respond, succeed, fail, cgi_get, cgi_dump, getmem, setmem, clearmem
from cantools.db import get, get_multi, get_schema, get_page, edit
from cantools import config
import model # load up all models (for schema)

def response():
	action = cgi_get("action", choices=["schema", "get", "edit", "delete"])

	# edit/delete always require credentials; getters do configurably
	if not config.db.public or action in ["edit", "delete"]:
		if cgi_get("pw") != config.admin.pw:
			fail("wrong")

	if action == "schema":
		succeed(get_schema())
	elif action == "get":
		sig = cgi_dump()
		res = getmem(sig, False)
		if not res:
			mname = cgi_get("modelName", required=False)
			keys = cgi_get("keys", required=False)
			if mname:
				res = get_page(mname, cgi_get("limit"), cgi_get("offset"),
					cgi_get("order", default="index"), cgi_get("filters", default={}))
			elif keys:
				res = [d.data() for d in get_multi(keys)]
			else:
				res = get(cgi_get("key")).data()
			if config.memcache.db:
				setmem(sig, res, False)
		succeed(res)
	elif action == "edit":
		if config.memcache.db:
			clearmem()
		succeed(edit(cgi_get("data")).data())
	elif action == "delete":
		get(cgi_get("key")).rm()
		succeed()

respond(response)