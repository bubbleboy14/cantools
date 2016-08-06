"""
### Usage: ctpubsub [-d domain] [-p port]

### Options:
    -h, --help            show this help message and exit
    -d DOMAIN, --domain=DOMAIN
                        use a specific domain (default: localhost)
    -p PORT, --port=PORT  use a specific port (default: 8888)
"""

from cantools import config
from bots import Bot

def start(host=config.pubsub.host, port=config.pubsub.port):
    from ps import PubSub
    PubSub(host, port).start()

def get_addr_and_start():
    from optparse import OptionParser
    parser = OptionParser("ctpubsub [-d domain] [-p port]")
    parser.add_option("-d", "--domain", dest="domain", default=config.pubsub.host,
        help="use a specific domain (default: %s)"%(config.pubsub.host,))
    parser.add_option("-p", "--port", dest="port", default=config.pubsub.port,
        help="use a specific port (default: %s)"%(config.pubsub.port,))
    options, arguments = parser.parse_args()
    start(options.domain, int(options.port))