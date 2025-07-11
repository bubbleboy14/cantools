import os, rel, ssl, sys, json
from dez.http import fetch as dfetch, post as dpost
from ..util import *
from ...util import set_log, set_error, init_rel
from .mail import send_mail, email_admins, email_reportees, mailer, reader, check_inbox, scanner, on_mail
from .sms import send_sms
from .controller import getController
from cantools import config

def fdup():
	import resource
	from cantools.util import log # gives us logger set in run_dez_webserver()
	log("checking the number of file descriptors allowed on your system", important=True)
	soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
	half = int(hard / 2)
	log("soft: %s. hard: %s. half: %s"%(soft, hard, half))
	if soft < half:
		log("increasing soft limit to half of hard limit")
		resource.setrlimit(resource.RLIMIT_NOFILE, (half, hard))
		log("new limits! soft: %s. hard: %s"%resource.getrlimit(resource.RLIMIT_NOFILE))

def log_kernel():
	from cantools.web.util import log
	log(json.dumps(rel.report()), "kernel")
	return True

TMSNAP = None

def log_tracemalloc():
	global TMSNAP
	import tracemalloc
	from cantools.util import log
	snapshot = tracemalloc.take_snapshot()
	log("[LINEMALLOC START]", important=True)
	if TMSNAP:
		lines = snapshot.compare_to(TMSNAP, 'lineno')
	else:
		lines = snapshot.statistics("lineno")
	TMSNAP = snapshot
	for line in lines[:10]:
		log(line)
	log("[LINEMALLOC END]", important=True)
	return True

PROC = None

def log_openfiles():
	global PROC
	from cantools.util import log
	if not PROC:
		import psutil
		PROC = psutil.Process(os.getpid())
	ofz = PROC.open_files()
	if config.log.oflist:
		log("OPEN FILES: %s"%(ofz,), important=True)
	else:
		log("OPEN FILE COUNT: %s"%(len(ofz),), important=True)
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
	init_rel()
	clog = config.log
	if clog.openfiles:
		rel.timeout(clog.openfiles, log_openfiles)
	if clog.tracemalloc:
		import tracemalloc
		tracemalloc.start()
		rel.timeout(clog.tracemalloc, log_tracemalloc)
	if "kernel" in clog.allow:
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
	from cantools.util import log # gives us logger set in run_dez_webserver()
	result = result.decode()
	code = result[0]
	if code not in "0123":
		log("response encoded:")
		log(result)
		log("attempting decode")
		result = dec(result)
	if code in "02":
		from cantools.util import log
		log("request failed!! : %s"%(result,), important=True)
	elif code == "3":
		return rec_conv(json.loads(result[1:]), True)
	else:
		return json.loads(result[1:])

def parse_url_parts(host, path, port, protocol):
	if "://" in host:
		protocol, host = host.split("://", 1)
		if "/" in host:
			host, path = host.split("/", 1)
			path = "/" + path
		else:
			path = "/"
	if ":" in host:
		host, port = host.split(":")
		port = int(port)
	elif not port:
		port = protocol == "https" and 443 or 80
	return host, path, port, protocol

def fetch(host, path="/", port=None, asjson=False, cb=None, timeout=1, asyn=False, protocol="http", ctjson=False, qsp=None, fakeua=False, retries=5):
	from cantools.util import log # gives us logger set in run_dez_webserver()
	host, path, port, protocol = parse_url_parts(host, path, port, protocol)
	if qsp:
		path += "?"
		for k, v in list(qsp.items()):
			path += "%s=%s&"%(k, v)
		path = path[:-1]
	gkwargs = {}
	headers = {}
	if fakeua:
		if type(fakeua) is str:
			headers['User-Agent'] = fakeua
		else:
			headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36'
		gkwargs["headers"] = headers
	if asyn or cb: # asyn w/o cb works, will just log
		secure = protocol == "https"
		if ctjson:
			orig_cb = cb or log
			cb = lambda v : orig_cb(_ctjson(v))
		return dfetch(host, path, port, secure, headers, cb, timeout, asjson)
	if timeout:
		gkwargs["timeout"] = timeout
	furl = "%s://%s:%s%s"%(protocol, host, port, path)
	log("fetch %s"%(furl,))
	return syncreq(furl, "get", asjson, ctjson, retries, gkwargs)

def post(host, path="/", port=80, data=None, protocol="http", asjson=False, ctjson=False, text=None, cb=None):
	if ctjson:
		data = rec_conv(data)
	if cb:
		if ctjson:
			orig_cb = cb
			cb = lambda v : orig_cb(_ctjson(v))
		host, path, port, protocol = parse_url_parts(host, path, port, protocol)
		return dpost(host, path, port, protocol == "https", data=data, text=text, cb=cb)
	url = "://" in host and host or "%s://%s:%s%s"%(protocol, host, port, path)
	log("post %s"%(url,))
	kwargs = {}
	if data:
		kwargs["json"] = data
	elif text:
		kwargs["data"] = text
	return syncreq(url, "post", asjson, ctjson, rekwargs=kwargs)

def _dosyncreq(requester, url, asjson, ctjson, rekwargs):
	result = requester(url, **rekwargs).content
	if ctjson:
		return _ctjson(result)
	return asjson and json.loads(result) or result

def syncreq(url, method="get", asjson=False, ctjson=False, retries=5, rekwargs={}):
	import time, requests
	attempt = 1
	requester = getattr(requests, method)
	while attempt < retries:
		try:
			return _dosyncreq(requester, url, asjson, ctjson, rekwargs)
		except requests.exceptions.ConnectionError:
			log("syncreq(%s %s) attempt #%s failed"%(method, url, attempt))
			time.sleep(1)
		attempt += 1
	return _dosyncreq(requester, url, asjson, ctjson, rekwargs) # final try-less try

# file uploads
def read_file(data_field):
	from .response import files
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
	for k, v in list(orig.items()):
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