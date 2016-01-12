from ..config import config

# later, switch these imports on 'db' instead of 'web_server'
if config.web_server == "gae":
	from gae.model import *
elif config.web_server == "dez":
	from sql.model import *
else:
	from cantools import util
	util.error("no data backend specified")