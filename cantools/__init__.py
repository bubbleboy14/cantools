import util
import config as cfgmod
config = cfgmod.config
import geo
from scripts import builder, deploy, init, pubsub, start, index, migrate

ctstart = start.go
ctdeploy = deploy.run
ctpubsub = pubsub.get_addr_and_start
ctinit = init.parse_and_make
ctindex = index.go
ctmigrate = migrate.go

__version__ = "0.7.1"
