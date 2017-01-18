import sys, json
from dez.memcache import get_memcache
from dez.http.application import HTTPApplication
from routes import static, cb
from cantools import config
sys.path.insert(0, ".") # for dynamically loading modules

A_STATIC = { "/": "_", "/js/CT/": "js/CT", "/logs/": "logs", "/logs": "logs" }
A_CB = { "/admin": "admin", "/_db": "_db" }

class CTWebBase(HTTPApplication):
    def __init__(self, bind_address, port, logger_getter, static=static, cb=cb):
        HTTPApplication.__init__(self, bind_address, port, logger_getter,
            "dez/cantools", config.ssl.certfile, config.ssl.keyfile)
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
        self.add_cb_rule("/_report", self.report)

    def report(self, req):
        report = json.dumps({
            "web": self.daemon.counter.report(),
            "admin": self.controller.admin.daemon.counter.report()
        })
        req.write("HTTP/1.0 200 OK\r\n\r\n%s"%(report,))
        req.close()

class Admin(CTWebBase):
    def __init__(self, bind_address, port, logger_getter):
        self.logger = logger_getter("Admin")
        CTWebBase.__init__(self, bind_address, port, logger_getter, A_STATIC, A_CB)