from rel import timeout
from dez.logging import get_logger_getter
from cantools import config
from cantools.util import read
from cantools.util import log as syslog
from ..util import do_respond

logger_getter = get_logger_getter("cron", syslog, config.log.allow)

secsPerUnit = {
    "hours": 60 * 60,
    "minutes": 60,
    "mins": 60,
    "seconds": 1
}

class Rule(object):
    def __init__(self, controller, url, rule):
        self.logger = logger_getter("Rule(%s -> %s)"%(rule, url))
        self.cb = None
        self.controller = controller
        self.url = url
        self.rule = rule
        self.words = rule.split(" ")
        self.timer = timeout(None, self.trigger)
        self.parse()

    def register_handler(self, args, kwargs):
        self.logger.info("register handler: %s"%(self.url,))
        kwargs["threaded"] = True
        self.cb = lambda : do_respond(*args, **kwargs)

    def trigger(self):
        self.logger.info("trigger")
        if not self.cb:
            self.logger.info("importing module: %s"%(self.url,))
            self.controller.current = self
            __import__(self.url[1:])
        self.cb()
        return True

    def start(self):
        self.logger.info("start (%s seconds)"%(self.seconds,))
        self.timer.add(self.seconds)

    def parse(self):
        self.logger.info("parse")
        if len(self.words) == 3 and self.words[0] == "every": # every [NUMBER] [UNIT]
            num = int(self.words[1])
            unit = self.words[2]
            self.seconds = num * secsPerUnit[unit]
        else: # we can implement more later...
            self.logger.error("can't parse: %s"%(self.line,))

class Cron(object):
    def __init__(self, controller):
        self.logger = logger_getter("Cron")
        self.controller = controller
        self.timers = {}
        self.parse()
        self.start()

    def parse(self):
        self.logger.info("parse")
        url = None
        for line in read("cron.yaml", True):
            if line.startswith("  url: "):
                url = line[7:].strip()
            elif url:
                self.timers[url] = Rule(self.controller, url, line[12:].strip())
                url = None

    def start(self):
        self.logger.info("start")
        for rule in self.timers.values():
            rule.start()