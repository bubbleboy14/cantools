from ..scripts.config import config

if config.web_server == "gae":
	from gae_server import *
elif config.web_server == "dez":
	from dez_server import *
else:
	from cantools import util
	util.error("no web server specified")

from util import *