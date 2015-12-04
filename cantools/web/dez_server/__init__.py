from dez.memcache import get_memcache
from server import get_dez_webserver

# memcache
mc = get_memcache()
getmem = mc.get
setmem = mc.set
delmem = mc.rm
clearmem = mc.clear

# requests


# responses
