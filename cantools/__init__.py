__version__ = "0.10.8.115"

from . import util, hooks
from . import config as cfgmod
config = cfgmod.config
include_plugin = cfgmod.include_plugin
mods_and_repos = cfgmod.mods_and_repos

if config.web.server == "gae":
	util.init_gae()
else:
	util.init_basic()
#from . import geo
from .scripts import builder, pubsub

def ctstart():
	from .scripts import start
	start.go()

def ctdeploy():
	from .scripts import deploy
	deploy.run()

def ctpubsub():
	pubsub.get_addr_and_start()

def ctinit():
	from .scripts import init
	init.parse_and_make()

def ctindex():
	from .scripts import index
	index.go()

def ctmigrate():
	from .scripts import migrate
	migrate.go()

def ctdoc():
	from .scripts import doc
	doc.build()

def ctbench():
	from .scripts import bench
	bench.run()

def ctutil():
	from .scripts import util
	util.run()