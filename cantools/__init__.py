from scripts import builder, deploy, pubsub, start, util
from scripts import config as cfgmod
import web

config = cfgmod.config
ctstart = start.go
ctdeploy = deploy.run
ctpubsub = pubsub.get_addr_and_start

__version__ = "0.3"