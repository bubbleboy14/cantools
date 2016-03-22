from optparse import OptionParser
from cantools.db import session, get_schema, get_model, put_multi, refresh_counter
from cantools.util import error, log, batch

counts = { "_counters": 0 }

def refmap():
	log("compiling back reference map")
	rmap = {}
	for tname, schema in get_schema().items():
		for pname, kinds in schema["_kinds"].items():
			reference = "%s.%s"%(tname, pname)
			counts[reference] = 0
			for kind in [k for k in kinds if k != "*"]: # skip wildcard for now
				if kind not in rmap:
					log("acquiring %s keys"%(kind,), 1)
					rmap[kind] = {
						"keys": session.query(getattr(get_model(kind), "key")).all(),
						"references": []
					}
				rmap[kind]["references"].append(reference)
	return rmap

def do_batch(chunk, reference, skip_existing):
	log("refreshing %s %s keys"%(len(chunk), reference), 1)
	i = 0
	rc = []
	for item in chunk: # item is single-member tuple
		c = refresh_counter(item[0], reference, skip_existing)
		if c:
			rc.append(c)
			i += 1
			if not i % 100:
				log("processed %s"%(i,), 3)
	counts[reference] += len(chunk)
	counts["_counters"] += len(rc)
	log("refreshed %s total"%(counts[reference],), 2)
	log("updated %s counters"%(counts["_counters"],), 2)
	put_multi(rc)
	log("saved", 2)

def go(skip_existing=False):
	log("indexing foreignkey references throughout database")
	import model # load schema
	for kind, data in refmap().items():
		log("processing table: %s"%(kind,), important=True)
		keys = data["keys"]
		for reference in data["references"]:
			batch(keys, do_batch, reference, skip_existing)
	tcount = sum(counts.values()) - counts["_counters"]
	log("refreshed %s rows and updated %s counters"%(tcount, counts["_counters"]), important=True)
	log("goodbye")

if __name__ == "__main__":
	parser = OptionParser("ctindex [-s]")
	parser.add_option("-s", "--skip_existing", action="store_true",
		dest="skip_existing", default=False,
		help="skip existing indices (good for resuming an interrupted job)")
	options, args = parser.parse_args()
	go(options.skip_existing)