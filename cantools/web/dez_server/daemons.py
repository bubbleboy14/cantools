import sys, json
from dez.memcache import get_memcache
from dez.http.application import HTTPApplication
from routes import static, cb
from cantools import config
sys.path.insert(0, ".") # for dynamically loading modules

A_STATIC = {
    "dynamic": { "/": "_/dynamic", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "static": { "/": "_/static", "/css/": "_/css", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" },
    "production": { "/": "_/production", "/css/": "_/css", "/logs/": "logs", "/logs": "logs" },
}
A_CB = { "/admin": "admin", "/_db": "_db" }

class CTWebBase(HTTPApplication):
    def __init__(self, bind_address, port, logger_getter, static=static, cb=cb):
        HTTPApplication.__init__(self, bind_address, port, logger_getter, "dez/cantools",
            config.ssl.certfile, config.ssl.keyfile, config.ssl.cacerts,
            config.mode == "production", config.web.rollz)
        self.memcache = get_memcache()
        self.handlers = {}
        for key, val in static.items():
            self.add_static_rule(key, val)
        for key, val in cb.items():
            self.add_cb_rule(key, self._handler(key, val))

    def _handler(self, rule, target):
        self.logger.info("setting handler: %s %s"%(rule, target))
        def h(req):
            self.logger.info("triggering handler: %s %s"%(rule, target))
            self.controller.trigger_handler(rule, target, req)
        return h

class Web(CTWebBase):
    def __init__(self, bind_address, port, logger_getter):
        self.logger = logger_getter("Web")
        CTWebBase.__init__(self, bind_address, port, logger_getter)

class Admin(CTWebBase):
    def __init__(self, bind_address, port, logger_getter):
        self.logger = logger_getter("Admin")
        CTWebBase.__init__(self, bind_address, port, logger_getter, A_STATIC[config.mode], A_CB)
        self.add_cb_rule("/_report", self.report)

    def report(self, req):
        report = json.dumps({
            "web": self.controller.web.daemon.counter.report(),
            "admin": self.daemon.counter.report()
        })
        req.write("HTTP/1.0 200 OK\r\n\r\n%s"%(report,))
        req.close()
