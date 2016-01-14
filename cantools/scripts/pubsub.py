from cantools import config

def start(host="localhost", port=config.pubsub.port):
    from ps import PubSub
    PubSub(host, port).start()

def get_addr_and_start():
    from optparse import OptionParser
    parser = OptionParser("ctpubsub [-d domain] [-p port]")
    parser.add_option("-d", "--domain", dest="domain", default="localhost",
        help="use a specific domain (default: localhost)")
    parser.add_option("-p", "--port", dest="port", default=config.pubsub.port,
        help="use a specific port (default: %s)"%(config.pubsub.port,))
    options, arguments = parser.parse_args()
    start(options.domain, options.port)

if __name__ == "__main__":
    get_addr_and_start()