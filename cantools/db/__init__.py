from ..config import config

# later, switch these imports on 'db' instead of 'web.server'
if config.web.server == "gae":
	from gae.model import *
elif config.web.server == "dez":
	from sql.model import *
	from sql.lookup import inc_counter, dec_counter, refresh_counter, refcount_subq
	from sql import lookup
else:
	from cantools import util
	util.error("no data backend specified")