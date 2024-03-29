__version__ = "0.10.8.113"

from . import util, hooks
from . import config as cfgmod
config = cfgmod.config
include_plugin = cfgmod.include_plugin
mods_and_repos = cfgmod.mods_and_repos

if config.web.server == "gae":
	util.init_gae()
else:
	util.init_basic()
from . import geo
from .scripts import builder, deploy, init, pubsub, start, index, migrate, doc, bench, util

ctstart = start.go
ctdeploy = deploy.run
ctpubsub = pubsub.get_addr_and_start
ctinit = init.parse_and_make
ctindex = index.go
ctmigrate = migrate.go
ctdoc = doc.build
ctbench = bench.run
ctutil = util.run