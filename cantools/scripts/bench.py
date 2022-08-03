"""
### Usage: ctbench [-bmsv] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY] [--weight=WEIGHT] [--keys=KEYS]

### Options:
    -h, --help            show this help message and exit
    -d DOMAIN, --domain=DOMAIN
                          hostname (default: 0.0.0.0)
    -p PORT, --port=PORT  port (default=8080)
    -n NUMBER, --number=NUMBER
                          number of requests (default=5000)
    -c CONCURRENCY, --concurrency=CONCURRENCY
                          number of connections (default=100)
    -w WEIGHT, --weight=WEIGHT
                          weight (size) of memcache blocks (default=10)
    -k KEYS, --keys=KEYS  key count - number of memcache blocks (default=10)
    -s, --static          random static (html/css) requests (default=False)
    -b, --blobs           random blob requests (default=False)
    -m, --memcache        random memcache requests (default=False)
    -v, --validate        validate return values (default=False)
"""

import os, rel, json
from optparse import OptionParser
from dez.samples.http_load_test import MultiTester
from cantools import config
from cantools.util import cmd, log, read, error, token
from cantools.web import post

NUMBER = 5000
CONCURRENCY = 100
WEIGHT = 10
KEYS = 10

class Bencher(object):
	def __init__(self, options):
		self.options = options
		if options.blobs or options.memcache or options.static:
			self.multi()
		else:
			self.single()

	def single(self):
		log("single (direct dbench) mode", important=True)
		oz = self.options
		rel.signal(2, rel.abort)
		cmd("dbench %s %s %s %s"%(oz.domain, oz.port, oz.number, oz.concurrency))

	def initmc(self):
		oz = self.options
		self.memcache = {}
		for key in map(lambda k : "bencher%s"%(k,), range(oz.keys)):
			val = self.memcache[key] = token(oz.weight)
			post(oz.domain, "/_memcache", oz.port, {
				"action": "set",
				"key": key,
				"value": val
			}, ctjson=True)

	def validator(self, path, value):
		if "memcache" in path:
			value = json.loads(value[1:])
		elif "blob" not in path:
			value = value.decode()
		if path in self.values and self.values[path] != value:
			log("returned:\n%s"%(value,), important=True)
			log("should have returned:\n%s"%(self.values[path],), important=True)
			error("return value mismatch: %s"%(path,))

	def regfiles(self, fpath, upath=None, files=None, binary=False, suffix=None):
		upath = upath or "/%s/"%(fpath,)
		fnames = files and files.keys() or os.listdir(fpath)
		log("including %s %s files"%(len(fnames), fpath))
		if self.options.validate:
			paths = []
			for fname in fnames:
				if suffix and not fname.endswith(suffix):
					continue
				path = "%s%s"%(upath, fname)
				paths.append(path)
				self.values[path] = files and files[fname] or read(os.path.join(fpath, fname), binary=binary)
		else:
			paths = list(map(lambda n : "%s%s"%(upath, n), fnames))
		return paths

	def multi(self):
		log("multi (randomized requests) mode", important=True)
		self.values = {}
		oz = self.options
		paths = []
		if oz.blobs:
			paths += self.regfiles("blob", binary=True)
		if oz.static:
			paths += self.regfiles("css")
			paths += self.regfiles(config.build.web[config.mode] or config.build.web.compiled[config.mode], "/", suffix=".html")
		if oz.memcache:
			self.initmc()
			paths += self.regfiles("memcache", "/_memcache?action=get&key=", self.memcache)
		paths or error("nothing to request!")
		log("randomizing requests among %s total items"%(len(paths),))
		MultiTester(oz.domain, oz.port, paths, oz.number, oz.concurrency, oz.validate and self.validator).start()

def run():
	parser = OptionParser("ctbench [-bmsv] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY] [--weight=WEIGHT] [--keys=KEYS]")
	parser.add_option("-d", "--domain", dest="domain", default=config.web.host,
		help="hostname (default: %s)"%(config.web.host,))
	parser.add_option("-p", "--port", dest="port", default=config.web.port,
		help="port (default=%s)"%(config.web.port,))
	parser.add_option("-n", "--number", dest="number", default=NUMBER,
		help="number of requests (default=%s)"%(NUMBER,))
	parser.add_option("-c", "--concurrency", dest="concurrency", default=CONCURRENCY,
		help="number of connections (default=%s)"%(CONCURRENCY,))
	parser.add_option("-w", "--weight", dest="weight", default=WEIGHT,
		help="weight (size) of memcache blocks (default=%s)"%(WEIGHT,))
	parser.add_option("-k", "--keys", dest="keys", default=KEYS,
		help="key count - number of memcache blocks (default=%s)"%(KEYS,))
	parser.add_option("-s", "--static", action="store_true", dest="static",
		default=False, help="random static (html/css) requests (default=False)")
	parser.add_option("-b", "--blobs", action="store_true", dest="blobs",
		default=False, help="random blob requests (default=False)")
	parser.add_option("-m", "--memcache", action="store_true", dest="memcache",
		default=False, help="random memcache requests (default=False)")
	parser.add_option("-v", "--validate", action="store_true", dest="validate",
		default=False, help="validate return values (default=False)")
	options = parser.parse_args()[0]
	options.port = int(options.port)
	options.number = int(options.number)
	options.concurrency = int(options.concurrency)
	Bencher(options)

if __name__ == "__main__":
	run()