import os, requests
from dez.http import fetch as dfetch
from ..util import *
from ...util import set_log, set_error
from mail import send_mail
from controller import getController
from cantools import config

def run_dez_webserver():
	c = getController()
	setlog(c.web.logger.simple)
	if config.web.log:
		set_log(config.web.log and os.path.join("logs", config.web.log))
	set_error(fail)
	c.start()

def dweb():
	return getController().web

def respond(*args, **kwargs):
	getController().register_handler(args, kwargs)

def fetch(host, path="/", port=80, asjson=False, cb=None, timeout=1, async=False, protocol="http"):
	if async:
		return dfetch(host, port, cb, timeout, asjson)
	if protocol == "https":
		port = 443
	result = requests.get("%s://%s:%s%s"%(protocol, host, port, path)).content
	return asjson and json.loads(result) or result

# file uploads
def read_file(data_field):
	return data_field.file.read()

# memcache stuff
def getmem(key, tojson=True):
	return dweb().memcache.get(key, tojson)

def setmem(key, val, fromjson=True):
	dweb().memcache.set(key, val, fromjson)

def delmem(key):
	dweb().memcache.rm(key)

def clearmem():
	dweb().memcache.clear()

def getcache():
	return dweb().memcache.cache

set_getmem(getmem)
set_setmem(setmem)
set_delmem(delmem)
set_clearmem(clearmem)

if __name__ == "__main__":
	run_dez_webserver()