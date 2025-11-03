import json, gc, os, inspect, threading, psutil
from babyweb import *
from babyweb.config import config as tinyfyg
from babyweb.daemons import WebBase, addWeb, logger_getter
from ..util import init_rel
from cantools import config

A_STATIC = {
    "dynamic": { "/": "_/dynamic", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "static": { "/": "_/static", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "production": { "/": "_/production", "/css/": "_/css", "/logs/": "logs", "/logs": "logs" },
}
A_CB = { "/admin": "admin", "/_db": "_db" }

def setcfg():
	for prop in ["cache", "encode", "mempad", "web", "cron", "scrambler"]:
		tinyfyg.update(prop, config[prop])
	for prop in ["contacts", "reportees"]:
		tinyfyg.admin.update(prop, config.admin[prop])
	for prop in ["verify", "certfile", "keyfile", "cacerts"]:
		tinyfyg.ssl.update(prop, config.ssl[prop])
	for prop in ["oflist", "openfiles", "tracemalloc", "allow"]:
		tinyfyg.log.update(prop, config.log[prop])
	tinyfyg.update("memcache", config.memcache.request)
	tmfg = tinyfyg.mail
	tmfg.update("mailer", config.mailer)
	tmfg.update("gmailer", config.gmailer)
	tmfg.update("name", config.mailername)
	tmfg.update("html", config.mailhtml)
	tmfg.update("verbose", config.mailoud)
	tmfg.update("scantick", config.mailscantick)

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

def run_tw():
	init_rel()
	addWeb("admin", Admin, config.admin)
	config.admin.update("pw",
		config.cache("admin password? ", overwrite=config.newpass))
	run_dez_webserver()

setcfg()

from babyweb.mail import send_mail, email_admins, email_reportees, mailer, reader, check_inbox, scanner, on_mail
from babyweb.sms import send_sms