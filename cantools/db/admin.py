from cantools.util import log
from cantools.db import get_model, put_multi

def index(kind): # be careful with this!
	mod = get_model(kind)
	items = mod.query().fetch() # gae doesn't support all()...
	log("assigning sequential index properties to %s %s records"%(len(items), kind), important=True)
	i = 0
	for item in items:
		i += 1
		item.index = i
		if not i % 100:
			log("processed %s %s entities"%(i, kind), 1)
	log("saving %s records"%(len(items),), important=True)
	put_multi(items)
