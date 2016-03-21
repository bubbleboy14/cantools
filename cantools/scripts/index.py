from cantools.db import get_schema, put_multi, refresh_counter
from cantools.util import error, log, batch

counts = { "_counters": 0 }

def refmap():
	log("compiling back reference map", 2)
	rmap = {}
	for tname, schema in get_schema().items():
		for pname, kinds in schema["_kinds"].items():
			reference = "%s.%s"%(tname, pname)
			counts[reference] = 0
			for kind in kinds:
				if kind not in rmap:
					log("acquiring %s keys"%(kind,), 3)
					rmap[kind] = {
						"keys": session.query("%s.key"%(kind,)).all(),
						"references": []
					}
				rmap[kind]["references"].append(reference)
	return rmap

def do_batch(chunk, reference):
	rc = []
	log("refreshing %s %s keys"%(len(chunk), reference), 3)
	for item in chunk:
		rc.append(refresh_counter(item, reference))
	counts[reference] += len(chunk)
	counts["_counters"] += len(rc)
	log("refreshed %s total"%(counts[reference],), 4)
	log("updated %s counters"%(len(counts["_counters"]),))
#	put_multi(chunk + rc)
	log("saved", 4)

def go():
	log("indexing foreignkey references throughout database")
	from model import * # load schema
	for kind, data in refmap().items():
		log("processing table: %s"%(kind,), 2)
		keys = data["keys"]
		references = data["references"]
		batch(keys, do_batch, reference)
	tcount = sum(counts.values()) - counts["_counters"]
	log("refreshed %s rows and updated %s counters"%(tcount, counts["_counters"]), 2)
	log("goodbye")

if __name__ == "__main__":
	go()