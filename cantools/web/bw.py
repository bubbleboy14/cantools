import json, gc, os, inspect, threading, psutil
from babyweb.daemons import WebBase, initWebs, logger_getter
from babyweb.server import run_dez_webserver
from babyweb.config import config as babyfyg
from babyweb.logger import log, syslog
from ..util import init_rel
from cantools import config

A_STATIC = {
    "dynamic": { "/": "_/dynamic", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "static": { "/": "_/static", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "production": { "/": "_/production", "/css/": "_/css", "/logs/": "logs", "/logs": "logs" },
}
A_CB = { "/admin": "admin", "/_db": "_db" }

def setcfg():
	syslog("passing configuration to babyweb")
	for prop in ["cache", "encode", "mempad", "web", "cron", "scrambler"]:
		babyfyg.update(prop, config[prop])
	for prop in ["contacts", "reportees"]:
		babyfyg.admin.update(prop, config.admin[prop])
	for prop in ["verify", "certfile", "keyfile", "cacerts"]:
		babyfyg.ssl.update(prop, config.ssl[prop])
	for prop in ["oflist", "openfiles", "tracemalloc", "allow"]:
		babyfyg.log.update(prop, config.log[prop])
	for prop in ["active", "user", "gateway", "minport", "maxport"]:
		babyfyg.proxy.update(prop, config.proxy[prop])
	babyfyg.update("memcache", config.memcache.request)
	bmfg = babyfyg.mail
	bmfg.update("mailer", config.mailer)
	bmfg.update("gmailer", config.gmailer)
	bmfg.update("name", config.mailername)
	bmfg.update("html", config.mailhtml)
	bmfg.update("verbose", config.mailoud)
	bmfg.update("scantick", config.mailscantick)

setcfg()

class Admin(WebBase):
    def __init__(self, bind_address, port, logger_getter, shield, mempad):
        self.logger = logger_getter("Admin")
        acfg = config.admin
        WebBase.__init__(self, bind_address, port, logger_getter, # share shield/blacklist
            A_STATIC[config.mode], A_CB, acfg.whitelist, config.web.blacklist, shield, mempad)
        self.add_cb_rule("/_report", self.report)

    def report(self, req):
        report = json.dumps({
            "threads": threading.active_count(),
            "stack_frames": len(inspect.stack()),
            "web": self.controller.webs["web"].daemon.counter.report(),
            "admin": self.daemon.counter.report(),
            "gc": len(gc.get_objects()),
            "mem": psutil.Process(os.getpid()).memory_percent()
        })
        self.logger.info(report)
        self.daemon.respond(req, report)

def run_bw():
	syslog("initializing web server")
	init_rel()
	initWebs({
		"admin": {
			"daemon": Admin,
			"config": config.admin
		}
	})
	config.admin.update("pw",
		config.cache("admin password? ", overwrite=config.newpass))
	run_dez_webserver()