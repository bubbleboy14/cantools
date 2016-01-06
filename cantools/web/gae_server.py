from google.appengine.runtime.apiproxy_errors import RequestTooLargeError
from util import *

envelope = {
    'plain': "\n\n%s",
    'html': "\n\n<html><head></head><body>%s</body></html>"
}

respond = do_respond
set_env(lambda html : envelope[html and 'html' or 'plain'])

# fetch
def fetch(host, path="/", port=80, json=False):
    from google.appengine.api.urlfetch import fetch
    raw = fetch("http://%s:%s%s"%(host, port, path)).content
    if json:
        return json.loads(raw)
    return raw

# file uploads
def read_file(data_field):
    try:
        return data_field.file.read()
    except RequestTooLargeError:
        fail("The file you are trying to upload is too large. Please submit something under 1MB. Thank you!", html=True, noenc=True)

# memcache stuff
def getmem(key, tojson=True):
    from google.appengine.api import memcache
    result = memcache.get(key)
    if result is None: return None
    return tojson and json.loads(result) or result

def setmem(key, val, fromjson=True):
    from google.appengine.api import memcache
    memcache.set(key, fromjson and json.dumps(val) or val)

def delmem(key):
    from google.appengine.api import memcache
    if memcache.get(key) is not None:
        memcache.delete(key)

def clearmem():
    from google.appengine.api import memcache
    memcache.flush_all()

set_getmem(getmem)
set_setmem(setmem)
set_delmem(delmem)
set_clearmem(clearmem)