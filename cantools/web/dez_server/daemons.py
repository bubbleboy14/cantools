import sys, json, gc, os, inspect, threading
try:
    import psutil
except ImportError as e:
    pass # google crap engine (get it if you need it!)
from dez.memcache import get_memcache
from dez.http.application import HTTPApplication
from .routes import static, cb
from cantools import config
sys.path.insert(0, ".") # for dynamically loading modules

A_STATIC = {
    "dynamic": { "/": "_/dynamic", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "static": { "/": "_/static", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "production": { "/": "_/production", "/css/": "_/css", "/logs/": "logs", "/logs": "logs" },
}
A_CB = { "/admin": "admin", "/_db": "_db" }

class CTWebBase(HTTPApplication):
    def __init__(self, bind_address, port, logger_getter, static=static, cb=cb, whitelist=[], blacklist=[], shield=False, mempad=0):
        isprod = config.mode == "production"
        HTTPApplication.__init__(self, bind_address, port, logger_getter, "dez/cantools",
            config.ssl.certfile, config.ssl.keyfile, config.ssl.cacerts,
            isprod, config.web.rollz, isprod, whitelist, blacklist, shield, mempad, config.web.xorigin)
        self.memcache = get_memcache()
        self.handlers = {}
        for key, val in list(static.items()):
            self.add_static_rule(key, val)
        for key, val in list(cb.items()):
            self.add_cb_rule(key, self._handler(key, val))

    def _handler(self, rule, target):
        self.logger.info("setting handler: %s %s"%(rule, target))
        def h(req):
            self.logger.info("triggering handler: %s %s"%(rule, target))
            self.controller.trigger_handler(rule, target, req)
        return h

class Web(CTWebBase):
    def __init__(self, bind_address, port, logger_getter, shield, mempad):
        self.logger = logger_getter("Web")
        wcfg = config.web
        CTWebBase.__init__(self, bind_address, port, logger_getter,
            whitelist=wcfg.whitelist, blacklist=wcfg.blacklist, shield=shield, mempad=mempad)

class Admin(CTWebBase):
    def __init__(self, bind_address, port, logger_getter, shield, mempad):
        self.logger = logger_getter("Admin")
        acfg = config.admin
        CTWebBase.__init__(self, bind_address, port, logger_getter, # share shield/blacklist
            A_STATIC[config.mode], A_CB, acfg.whitelist, config.web.blacklist, shield, mempad)
        self.add_cb_rule("/_report", self.report)

    def report(self, req):
        report = json.dumps({
            "threads": threading.active_count(),
            "stack_frames": len(inspect.stack()),
            "web": self.controller.web.daemon.counter.report(),
            "admin": self.daemon.counter.report(),
            "gc": len(gc.get_objects()),
            "mem": psutil.Process(os.getpid()).memory_percent()
        })
        self.logger.info(report)
        self.daemon.respond(req, report)