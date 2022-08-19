"""
### Usage: ctbench [-bmsv] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY] [--weight=WEIGHT] [--keys=KEYS]

### Options:
    -h, --help            show this help message and exit
    -e, --encrypted       use encrypted (https) connection
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
    -l PIPELINERS, --pipeliners=PIPELINERS
                          number of pipelined requests (default=50)
    -s, --static          random static (html/css) requests (default=False)
    -b, --blobs           random blob requests (default=False)
    -m, --memcache        random memcache requests (default=False)
    -v, --validate        validate return values (default=False)
"""

import os, rel, json
from optparse import OptionParser
from dez.bench import MultiTester
from cantools import config
from cantools.util import cmd, log, read, error, token
from cantools.web import post

NUMBER = 5000
CONCURRENCY = 100
WEIGHT = 10
KEYS = 10
PIPES = 50

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
		cstr = "dbench %s %s %s %s %s"%(oz.domain, oz.port, oz.number, oz.concurrency, oz.pipeliners)
		if oz.encrypted:
			cstr += " -e"
		cmd(cstr)

	def initmc(self):
		oz = self.options
		self.memcache = {}
		self.mccount = 0
		proto = oz.encrypted and "https" or "http"
		for key in map(lambda k : "bencher%s"%(k,), range(oz.keys)):
			val = self.memcache[key] = token(oz.weight)
			post(oz.domain, "/_memcache", oz.port, {
				"action": "set",
				"key": key,
				"value": val
			}, proto, cb=self.regmc)
		rel.signal(2, rel.abort)
		rel.dispatch()

	def initpaths(self):
		oz = self.options
		paths = self.paths = []
		self.values = {}
		if oz.blobs:
			paths += self.regfiles("blob", binary=True)
		if oz.static:
			paths += self.regfiles("css")
			paths += self.regfiles(config.build.web[config.mode] or config.build.web.compiled[config.mode],
				"/", suffix=".html")
		if oz.memcache:
			paths += self.regfiles("memcache", "/_memcache?action=get&key=", self.memcache)
		paths or error("nothing to request!")
		log("randomizing requests among %s total items"%(len(paths),))

	def validator(self, path, value, headers):
		vlen = len(value)
		clen = int(headers['content-length'])
		if vlen != clen:
			error("content-length mismatch! %s != %s"%(vlen, clen))
		if "memcache" in path:
			value = json.loads(value[1:])
		elif "blob" not in path:
			value = value.decode()
		if path in self.values and self.values[path] != value:
			log("returned:\n%s"%(value,), important=True)
			log("should have returned:\n%s"%(self.values[path],), important=True)
			error("return value mismatch: %s"%(path,))

	def regmc(self, resp):
		self.mccount += 1
		log("regmc %s"%(self.mccount,))
		if self.mccount == self.options.keys:
			log("registered %s memcache keys"%(self.mccount,))
			self._multi()

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

	def _multi(self):
		oz = self.options
		self.initpaths()
		MultiTester(oz.domain, oz.port, self.paths, oz.number, oz.concurrency,
			oz.pipeliners, oz.encrypted, oz.validate and self.validator).start()

	def multi(self):
		log("multi (randomized requests) mode", important=True)
		if self.options.memcache:
			self.initmc()
		else:
			self._multi()

def run():
	parser = OptionParser("ctbench [-bmsve] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY] [--weight=WEIGHT] [--keys=KEYS] [--pipeliners=PIPELINERS]")
	parser.add_option("-e", "--encrypted", action="store_true", dest="encrypted",
		default=False, help="use encrypted (https) connection")
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
	parser.add_option("-l", "--pipeliners", dest="pipeliners", default=PIPES,
		help="number of pipelined requests (default=%s)"%(PIPES,))
	parser.add_option("-s", "--static", action="store_true", dest="static",
		default=False, help="random static (html/css) requests (default=False)")
	parser.add_option("-b", "--blobs", action="store_true", dest="blobs",
		default=False, help="random blob requests (default=False)")
	parser.add_option("-m", "--memcache", action="store_true", dest="memcache",
		default=False, help="random memcache requests (default=False)")
	parser.add_option("-v", "--validate", action="store_true", dest="validate",
		default=False, help="validate return values (default=False)")
	options = parser.parse_args()[0]
	for key in ["port", "number", "concurrency", "weight", "keys", "pipeliners"]:
		setattr(options, key, int(getattr(options, key)))
	Bencher(options)

if __name__ == "__main__":
	run()