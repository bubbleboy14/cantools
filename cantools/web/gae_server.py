from util import *
envelope = {
    'plain': "\n\n%s",
    'html': "\n\n<html><head></head><body>%s</body></html>"
}

respond = do_respond
set_env(lambda html : envelope[html and 'html' or 'plain'])

# memcache stuff
def _getmem(key, tojson=True):
    from google.appengine.api import memcache
    result = memcache.get(key)
    if result is None: return None
    return tojson and json.loads(result) or result

def _setmem(key, val, fromjson=True):
    from google.appengine.api import memcache
    memcache.set(key, fromjson and json.dumps(val) or val)

def _delmem(key):
    from google.appengine.api import memcache
    if memcache.get(key) is not None:
        memcache.delete(key)

def _clearmem():
    from google.appengine.api import memcache
    memcache.flush_all()

set_getmem(_getmem)
set_setmem(_setmem)
set_delmem(_delmem)
set_clearmem(_clearmem)