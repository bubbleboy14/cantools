from cantools.db import get_model, get_schema, put_multi
from cantools.util import log

def index(kind, i=0): # be careful with this!
	kinds = kind == "*" and get_schema().keys() or [kind]
	puts = []
	for kind in kinds:
		mod = get_model(kind)
		items = mod.query().fetch() # gae doesn't support all()...
		log("assigning sequential index properties to %s %s records"%(len(items), kind), important=True)
		for n in range(len(items)):
			item = items[n]
			i += 1
			item.index = i
			if n and not n % 100:
				log("processed %s %s entities"%(n, kind), 1)
		log("processed %s %s entities"%(len(items), kind))
		puts += items
	log("saving %s records"%(len(puts),), important=True)
	put_multi(puts)
	return i