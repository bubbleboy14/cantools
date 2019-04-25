__version__ = "0.10.8.27"

import util, hooks
import config as cfgmod
config = cfgmod.config
include_plugin = cfgmod.include_plugin
mods_and_repos = cfgmod.mods_and_repos

if config.web.server == "gae":
	util.init_gae()
import geo
from scripts import builder, deploy, init, pubsub, start, index, migrate, doc

ctstart = start.go
ctdeploy = deploy.run
ctpubsub = pubsub.get_addr_and_start
ctinit = init.parse_and_make
ctindex = index.go
ctmigrate = migrate.go
ctdoc = doc.build
