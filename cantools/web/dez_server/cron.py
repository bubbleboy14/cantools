import time
from datetime import datetime, timedelta
from rel import timeout
from cantools import config
from cantools.util import read, write
from ..util import do_respond

secsPerUnit = {
    "days": 60 * 60 * 24,
    "hours": 60 * 60,
    "minutes": 60,
    "mins": 60,
    "seconds": 1
}

class Rule(object):
    def __init__(self, controller, scheduler, url, rule, logger_getter):
        self.logger = logger_getter("Rule(%s -> %s)"%(rule, url))
        self.controller = controller
        self.scheduler = scheduler
        self.url = url
        self.rule = rule
        self.exact = len(rule) == 5 # 17:00
        self.words = rule.split(" ")
        self.timer = timeout(None, self.trigger)
        self.parse()

    def trigger(self):
        self.logger.info("trigger: %s (%s)"%(self.url, getattr(self, "seconds", self.rule)))
        self.controller.trigger_handler(self.url, self.url[1:])
        if not self.exact and self.rule != "on start":
            self.scheduler.update(self)
        return True

    def start(self):
        if self.rule != "on start":
            self.logger.info("start (%s seconds)"%(self.seconds,))
            self.timer.add(self.seconds)
            if self.exact:
                self.timer.delay = 60 * 60 * 24
            else:
                ff = self.scheduler.ff(self)
                if ff:
                    self.logger.info("rescheduled for %s seconds"%(self.timer.delay - ff,))
                    self.timer.expiration -= ff

    def parse(self):
        self.logger.info("parse")
        if self.exact:
            hours, mins = self.rule.split(":")
            n = datetime.now()
            t = datetime(n.year, n.month, n.day, int(hours), int(mins))
            self.seconds = (t - n).seconds
        elif self.rule == "on start":
            self.logger.info("triggering start script")
            self.trigger()
        elif len(self.words) == 3 and self.words[0] == "every": # every [NUMBER] [UNIT]
            num = int(self.words[1])
            unit = self.words[2]
            self.seconds = num * secsPerUnit[unit]
        else: # we can implement more later...
            self.logger.error("can't parse: %s"%(self.rule,))

class Scheduler(object):
    def __init__(self, logger_getter):
        self.logger_getter = logger_getter
        self.logger = logger_getter("Scheduler")
        self.lasts = read("cron.ts", isjson=True, default={})
        self.logger.info("initialized with %s timestamps"%(len(self.lasts.keys()),))

    def update(self, rule):
        self.lasts[rule.url] = time.time()
        self.logger.info("updating %s timestamp to %s"%(rule.url, self.lasts[rule.url]))
        write(self.lasts, "cron.ts", isjson=True)

    def ff(self, rule):
        if rule.url in self.lasts:
            ff = min(rule.seconds, time.time() - self.lasts[rule.url])
            self.logger.info("fast-forwarding %s %s seconds"%(rule.url, ff))
            return ff
        elif config.cron.catchup:
            self.logger.info("catching up %s"%(rule.url,))
            return rule.seconds

class Cron(object):
    def __init__(self, controller, logger_getter):
        self.logger_getter = logger_getter
        self.logger = logger_getter("Cron")
        self.scheduler = Scheduler(logger_getter)
        self.controller = controller
        self.timers = {}
        self.parse()
        self.start()

    def parse(self):
        self.logger.info("parse")
        url = None
        for line in read("cron.yaml", True):
            if line.startswith("- description: "):
                self.logger.info("initializing %s"%(line[15:],))
            elif line.startswith("  url: "):
                url = line[7:].strip()
            elif url:
                self.timers[url] = Rule(self.controller, self.scheduler,
                    url, line[12:].strip(), self.logger_getter)
                url = None

    def start(self):
        self.logger.info("start")
        for rule in list(self.timers.values()):
            rule.start()