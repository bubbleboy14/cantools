"""
Run this if your CTRefCount records get messed up for
some reason. It will go through and recount everything.
"""

from cantools.util import error, log, batch
from cantools import config
if config.web.server == "dez":
	from cantools.db import session, func, get_schema, get_model, put_multi, refresh_counter

counts = { "_counters": 0 }

def get_keys(kind, reference):
	log("acquiring %s (%s) keys"%(kind, reference), 1)
	mod = get_model(kind)
	q = session.query(getattr(mod, "key"))
	qcount = q.count()
	log("found %s"%(qcount,), 2)
	fname, fkey = reference.split(".")
	fmod = get_model(fname)
	fprop = getattr(fmod, fkey)
	sub = session.query(fprop, func.count("*").label("sub_count")).group_by(fprop).subquery()
	q = q.join(sub, mod.key==getattr(sub.c, fkey))
	newcount = q.count()
	log("filtering out %s untargetted entities"%(qcount - newcount), 2)
	qcount = newcount
	log("returning %s keys"%(qcount,), 2)
	return q.all()

def refmap():
	log("compiling back reference map")
	rmap = {}
	for tname, schema in get_schema().items():
		for pname, kinds in schema["_kinds"].items():
			reference = "%s.%s"%(tname, pname)
			counts[reference] = 0
			for kind in [k for k in kinds if k != "*"]: # skip wildcard for now
				if kind not in rmap:
					rmap[kind] = {}
				rmap[kind][reference] = get_keys(kind, reference)
	return rmap

def do_batch(chunk, reference):
	log("refreshing %s %s keys"%(len(chunk), reference), 1)
	i = 0
	rc = []
	for item in chunk: # item is single-member tuple
		rc.append(refresh_counter(item[0], reference))
		i += 1
		if not i % 100:
			log("processed %s"%(i,), 3)
	counts[reference] += len(chunk)
	counts["_counters"] += len(rc)
	log("refreshed %s total"%(counts[reference],), 2)
	log("updated %s counters"%(counts["_counters"],), 2)
	put_multi(rc)
	log("saved", 2)

def go():
	if config.web.server != "dez":
		error("ctindex only available for dez projects")
	log("indexing foreignkey references throughout database")
	import model # load schema
	for kind, references in refmap().items():
		log("processing table: %s"%(kind,), important=True)
		for reference, keys in references.items():
			batch(keys, do_batch, reference)
	tcount = sum(counts.values()) - counts["_counters"]
	log("refreshed %s rows and updated %s counters"%(tcount, counts["_counters"]), important=True)
	log("goodbye")

if __name__ == "__main__":
	go()