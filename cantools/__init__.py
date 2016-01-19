import config as cfgmod
config = cfgmod.config

import util
from scripts import builder, deploy, init, pubsub, start

ctstart = start.go
ctdeploy = deploy.run
ctpubsub = pubsub.get_addr_and_start
ctinit = init.parse_and_make

__version__ = "0.4.5"