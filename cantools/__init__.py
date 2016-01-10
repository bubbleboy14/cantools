import util
import config as cfgmod
from scripts import builder, deploy, init, pubsub, start

config = cfgmod.config
ctstart = start.go
ctdeploy = deploy.run
ctpubsub = pubsub.get_addr_and_start
ctinit = init.parse_and_make

__version__ = "0.4.1"