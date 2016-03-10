from util import config

if config.web.server == "gae":
	from gae_server import *
elif config.web.server == "dez":
	from cantools.web.dez_server import *
else:
	from cantools import util
	util.error("no web server specified")