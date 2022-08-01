"""
### Usage: ctbench [-bms] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY]

### Options:
    -h, --help            show this help message and exit
    -d DOMAIN, --domain=DOMAIN
                          hostname (default: 0.0.0.0)
    -p PORT, --port=PORT  port (default=8080)
    -n NUMBER, --number=NUMBER
                          number of requests (default=5000)
    -c CONCURRENCY, --concurrency=CONCURRENCY
                          number of connections (default=100)
    -s, --static          random static (html/css) requests (default=False)
    -b, --blobs           random blob requests (default=False)
    -m, --memcache        random memcache requests (default=False)
"""

import os
from optparse import OptionParser
from cantools import config
from cantools.util import cmd, log, error

NUMBER = 5000
CONCURRENCY = 100

class Bencher(object):
	def __init__(self, options):
		self.options = options
		if options.blobs or options.memcache or options.static:
			self.multi()
		else:
			self.single()

	def single(self):
		import rel
		oz = self.options
		rel.signal(2, rel.abort)
		cmd("dbench %s %s %s %s"%(oz.domain, oz.port, oz.number, oz.concurrency))

	def multi(self):
		from dez.samples.http_load_test import MultiTester
		log("multi (randomized requests) mode")
		oz = self.options
		fpaths = []
		if oz.blobs:
			blobz = os.listdir("blob")
			log("including %s blob files"%(len(blobz),))
			fpaths += list(map(lambda n : "/blob/%s"%(n,), blobz))
		if oz.static:
			statz = os.listdir(config.build.web[config.mode] or config.build.web.compiled[config.mode])
			cssz = os.listdir("css")
			log("including %s html files and %s css files"%(len(statz), len(cssz)))
			fpaths += list(map(lambda n : "/%s"%(n,), statz))
			fpaths += list(map(lambda n : "/css/%s"%(n,), cssz))
		if oz.memcache:
			error("memcache unimplemented!") # TODO
		fpaths or error("nothing to request!")
		log("randomizing requests among %s total items"%(len(fpaths),))
		MultiTester(oz.domain, int(oz.port), fpaths, oz.number, oz.concurrency).start()

def run():
	parser = OptionParser("ctbench [-bms] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY]")
	parser.add_option("-d", "--domain", dest="domain", default=config.web.host,
		help="hostname (default: %s)"%(config.web.host,))
	parser.add_option("-p", "--port", dest="port", default=config.web.port,
		help="port (default=%s)"%(config.web.port,))
	parser.add_option("-n", "--number", dest="number", default=NUMBER,
		help="number of requests (default=%s)"%(NUMBER,))
	parser.add_option("-c", "--concurrency", dest="concurrency", default=CONCURRENCY,
		help="number of connections (default=%s)"%(CONCURRENCY,))
	parser.add_option("-s", "--static", action="store_true", dest="static",
		default=False, help="random static (html/css) requests (default=False)")
	parser.add_option("-b", "--blobs", action="store_true", dest="blobs",
		default=False, help="random blob requests (default=False)")
	parser.add_option("-m", "--memcache", action="store_true", dest="memcache",
		default=False, help="random memcache requests (default=False)")
	Bencher(parser.parse_args()[0])

if __name__ == "__main__":
	run()