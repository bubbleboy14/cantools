from dez.network import SocketController
from cantools import config
from daemons import Web, Admin
from cron import Cron

CTR = None

def getController():
	global CTR
	if not CTR:
		# web
		CTR = SocketController()
		CTR.web = CTR.register_address(config.web.host, config.web.port, dclass=Web)
		CTR.web.controller = CTR

		# admin
		config.admin.update("pw", config.cache("admin password? "))
		CTR.admin = CTR.register_address(config.admin.host, config.admin.port, dclass=Admin)
		CTR.admin.controller = CTR

		# cron
		Cron(CTR)

	return CTR