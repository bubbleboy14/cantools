import json
from cantools.web import respond, succeed, fail, send_file, send_text, cgi_get, cgi_dump, read_file, getmem, setmem, clearmem
from cantools.db import get, get_model, get_schema, get_page, get_bulker, get_multi, put_multi, edit, dprep, admin, BlobWrapper
from cantools.util.data import props, spreadsheet
from cantools.util import getxls
from cantools import config
import model # load up all models (for schema)

def response():
	action = cgi_get("action", choices=["schema", "get", "blob", "edit", "delete", "put", "index", "bulk", "spreadsheet", "credcheck"])

	# edit/delete/put/index/bulk always require credentials; getters do configurably
	if not config.db.public or action in ["edit", "delete", "put", "index", "bulk", "spreadsheet", "credcheck"]:
		pw = cgi_get("pw")
		if pw != config.admin.pw:
			if not pw or pw != config.apikey:
				fail("wrong")

	# clear cache!
	if config.memcache.db and action in ["edit", "delete", "put", "bulk"]:
		clearmem()

	if action == "schema":
		succeed(get_schema())
	elif action == "bulk":
		rawd = read_file(cgi_get("data"))
		mname = cgi_get("modelName")
		fixed = json.loads(cgi_get("fixed", default="{}"))
		mod = get_model(mname)
		bulker = get_bulker(mname)
		if bulker:
			bulker(rawd, fixed)
		else:
			data = getxls(rawd) # add: csv, etc
			schema = get_schema(mname)
			smap = {}
			headers = data.pop(0)
			puts = []
			for index in range(len(headers)):
				header = headers[index]
				if header in schema:
					smap[header] = index
			for properties in data:
				kwargs = {}
				for p in smap:
					kwargs[p] = properties[smap[p]]
				for p in fixed:
					kwargs[p] = fixed[p]
				puts.append(mod(**kwargs))
			put_multi(puts)
	elif action == "spreadsheet":
		ssform = cgi_get("format", default="csv")
		mname = cgi_get("modelName")
		mod = get_model(mname)
		fkey = cgi_get("fixed_key", required=False)
		fval = cgi_get("fixed_value", required=False)
		q = mod.query()
		if fkey:
			q.filter(getattr(mod, fkey) == fval)
			mname = "%s_%s"%(mname, fval)
		send_text(spreadsheet(ssform, q.all(), props(mod)), ssform, mname)
	elif action == "get":
		sig = cgi_dump()
		res = config.memcache.db and getmem(sig, False) or None
		if not res:
			mname = cgi_get("modelName", required=False)
			keys = cgi_get("keys", required=False)
			exporter = cgi_get("exporter", default="export")
			if mname:
				order = cgi_get("order", default="index")
				if config.web.server == "gae":
					order = getattr(get_model(mname), order)
				res = get_page(mname, int(cgi_get("limit")), int(cgi_get("offset")), order,
					cgi_get("filters", default={}), count=cgi_get("count", required=False), exporter=exporter)
			elif keys:
				res = [getattr(d, exporter)() for d in get_multi(keys)]
			else:
				res = getattr(get(cgi_get("key")), exporter)()
			if config.memcache.db and config.web.server == "dez":
				setmem(sig, res, False)
		succeed(res)
	elif action == "blob":
		value = cgi_get("value", required=False) # fastest way
		data = cgi_get("data", required=False)
		prop = cgi_get("property", required=False)
		entkey = cgi_get("key", required=False)
		ent = entkey and get(entkey)
		blob = value and BlobWrapper(value=value) or (ent and prop and getattr(ent, prop))
		if cgi_get("delBlob", default=False):
			blob.delete()
			setattr(ent, prop, None)
			ent.put()
		elif data:
			if config.memcache.db:
				clearmem()
			if False:#value: # screw this -- doesn't update entity
				blob.set(read_file(data))
			else: # going by key, property -- must update index
				setattr(ent, prop, read_file(data))
				ent.put()
				blob = getattr(ent, prop)
			succeed(blob.urlsafe())
		else:
			if not value and hasattr(ent, "getBlob"): # for custom blob construction (such as split up gae blobs)
				blob = ent.getBlob()
			if config.web.server == "gae":
				send_file(blob) # no magic :'(
			else:
				if hasattr(blob, "get"): # if not getBlob(), essentially
					blob = blob.get()
				send_file(blob, detect=True)
	elif action == "edit":
		succeed(getattr(edit(cgi_get("data")), cgi_get("exporter", default="data"))())
	elif action == "put":
		put_multi([get_model(d["modelName"])(**dprep(d)) for d in cgi_get("data")])
	elif action == "delete":
		get(cgi_get("key")).rm()
	elif action == "index":
		setmem("last_index", admin.index(cgi_get("kind", default="*"),
			getmem("last_index", False) or int(cgi_get("index", default=0))), False)

respond(response)