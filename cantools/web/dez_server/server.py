import os, rel, ssl, sys, json, requests
from dez.http import fetch as dfetch
from ..util import *
from ...util import set_log, set_error
from mail import send_mail
from controller import getController
from cantools import config

def fdup():
	import resource
	from cantools.util import log # gives us logger set in run_dez_webserver()
	log("checking the number of file descriptors allowed on your system", important=True)
	soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
	log("soft: %s. hard: %s"%(soft, hard))
	if soft != hard:
		log("increasing soft limit to hard limit")
		resource.setrlimit(resource.RLIMIT_NOFILE, (hard, hard))
		log("new limits! soft: %s. hard: %s"%resource.getrlimit(resource.RLIMIT_NOFILE))

def log_kernel():
	from cantools.web.util import log
	log(json.dumps(rel.report()), "kernel")
	return True

def quit():
	from cantools.util import log
	if config.web.errlog:
		log("closing error log", important=True)
		sys.stderr.close()
	log("quitting - goodbye!", important=True)

def run_dez_webserver():
	if not config.ssl.verify and hasattr(ssl, "_https_verify_certificates"):
		ssl._https_verify_certificates(False)
	c = getController()
	setlog(c.web.logger.simple)
	if config.web.log:
		set_log(os.path.join("logs", config.web.log))
	if "kernel" in config.log.allow:
		rel.timeout(1, log_kernel)
	set_error(fail)
	if config.fdup:
		fdup()
	if config.web.errlog:
		sys.stderr = open(os.path.join("logs", config.web.errlog), "a")
	c.start(quit)

def dweb():
	return getController().web

def respond(*args, **kwargs):
	getController().register_handler(args, kwargs)

def _ctjson(result):
	if result[0] == "3":
		return rec_conv(json.loads(result[1:]), True)
	else:
		return json.loads(result[1:])

def fetch(host, path="/", port=80, asjson=False, cb=None, timeout=1, async=False, protocol="http", ctjson=False, qsp=None):
	if "://" in host:
		protocol, host = host.split("://")
		host, path = host.split("/", 1)
		path = "/" + path
	if ":" in host:
		host, port = host.split(":")
		port = int(port)
	if qsp:
		path += "?"
		for k, v in qsp.items():
			path += "%s=%s&"%(k, v)
		path = path[:-1]
	if async or cb: # async w/o cb works, will just log
		return dfetch(host, path, port, cb, timeout, asjson)
	if protocol == "https":
		port = 443
	result = requests.get("%s://%s:%s%s"%(protocol, host, port, path)).content
	if ctjson: # sync only
		return _ctjson(result)
	return asjson and json.loads(result) or result

def post(host, path="/", port=80, data=None, protocol="http", asjson=False, ctjson=False):
	if ctjson:
		data = rec_conv(data)
	result = requests.post("%s://%s:%s%s"%(protocol, host, port, path), json=data).content
	if ctjson:
		return _ctjson(result)
	return asjson and json.loads(result) or result

# file uploads
def read_file(data_field):
	from response import files
	return files.pop(data_field)

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
	c = {}
	orig = dweb().memcache.cache
	for k, v in orig.items():
		if v.__class__ == set:
			v = list(v)
		elif v.__class__ == dict and "ttl" in v: # countdown
			v = str(v)
		c[k] = v
	return c

set_getmem(getmem)
set_setmem(setmem)
set_delmem(delmem)
set_clearmem(clearmem)

if __name__ == "__main__":
	run_dez_webserver()