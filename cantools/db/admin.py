from cantools.util import log
from cantools.db import get_model, get_schema, put_multi

def index(kind): # be careful with this!
	kinds = kind == "*" and get_schema().keys() or [kind]
	i = 0
	puts = []
	for kind in kinds:
		mod = get_model(kind)
		items = mod.query().fetch() # gae doesn't support all()...
		log("assigning sequential index properties to %s %s records"%(len(items), kind), important=True)
		for item in items:
			i += 1
			item.index = i
			if not i % 100:
				log("processed %s %s entities"%(i, kind), 1)
		log("processed %s %s entities"%(i, kind))
		puts += items
	log("saving %s records"%(len(items),), important=True)
	put_multi(items)
