"""
### Usage: ctbench [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY]

### Options:
    -h, --help            show this help message and exit
    -d DOMAIN, --domain=DOMAIN
                          hostname (default: 0.0.0.0)
    -p PORT, --port=PORT  port (default=8080)
    -n NUMBER, --number=NUMBER
                          number of requests (default=5000)
    -c CONCURRENCY, --concurrency=CONCURRENCY
                          number of connections (default=50)
"""

import os
from optparse import OptionParser
from cantools import config
from cantools.util import cmd, error

NUMBER = 5000
CONCURRENCY = 100

def run():
	parser = OptionParser("ctbench [-b] [--domain=DOMAIN] [--port=PORT] [--number=NUMBER] [--concurrency=CONCURRENCY]")
	parser.add_option("-d", "--domain", dest="domain", default=config.web.host,
		help="hostname (default: %s)"%(config.web.host,))
	parser.add_option("-p", "--port", dest="port", default=config.web.port,
		help="port (default=%s)"%(config.web.port,))
	parser.add_option("-n", "--number", dest="number", default=NUMBER,
		help="number of requests (default=%s)"%(NUMBER,))
	parser.add_option("-c", "--concurrency", dest="concurrency", default=CONCURRENCY,
		help="number of connections (default=%s)"%(CONCURRENCY,))
	parser.add_option("-b", "--blobs", action="store_true", dest="blobs",
		default=False, help="random blob requests (default=False)")
	options, args = parser.parse_args()
	if options.blobs:
		from dez.samples.http_load_test import MultiTester
		bpaths = list(map(lambda n : "/blob/%s"%(n,), os.listdir("blob")))
		bpaths or error("no blobs!")
		print("randomizing requests among", len(bpaths), "/blob/ items")
		MultiTester(options.domain, int(options.port), bpaths, options.number, options.concurrency).start()
	else:
		import rel
		rel.signal(2, rel.abort)
		cmd("dbench %s %s %s %s"%(options.domain, options.port, options.number, options.concurrency))

if __name__ == "__main__":
	run()