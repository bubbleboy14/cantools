import getpass
from dez.network import SocketController
from cantools import config
from daemons import Web, Admin

CTR = None

def getController():
	global CTR
	if not CTR:
		CTR = SocketController()
		CTR.web = CTR.register_address(config.web.host, config.web.port, dclass=Web)
		CTR.web.controller = CTR
		config.admin.update("pw", getpass.getpass("admin password? "))
		CTR.admin = CTR.register_address(config.admin.host, config.admin.port, dclass=Admin)
		CTR.admin.controller = CTR
	return CTR