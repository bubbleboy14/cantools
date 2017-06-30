import os
from cantools.web import respond, succeed, fail, cgi_get, getcache, clearmem
from cantools import config

def response():
    action = cgi_get("action", choices=["db", "memcache", "mcclear", "monitor", "pubsub"])
    if cgi_get("pw") != config.admin.pw:
        fail("wrong");
    if action == "memcache":
        succeed(getcache())
    elif action == "mcclear":
        clearmem()
        succeed()
    else:
        obj = { "host": config.pubsub.host, "port": config.pubsub.port }
        if action == "monitor": # vs pubsub
            if config.admin.monitor.geo:
                obj["geo"] = config.admin.monitor.geo
            p = os.path.join("logs", "monitor")
            if config.admin.monitor.log and os.path.isdir(p):
                obj["logs"] = logs = []
                for year in os.listdir(p):
                    yp = os.path.join(p, year)
                    for month in os.listdir(yp):
                        mp = os.path.join(yp, month)
                        for day in os.listdir(mp):
                            dp = os.path.join(mp, day)
                            logs.append((dp, os.listdir(dp)))
        succeed(obj)

respond(response)