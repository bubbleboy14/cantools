import os, sys
from datetime import datetime

LOG_FILE = None
ERROR_CB = None
TIME_CBS = {}

def start_timer(tname):
    TIME_CBS[tname] = datetime.now()

def end_timer(tname, msg=""):
    diff = datetime.now() - TIME_CBS[tname]
    log("[timer] Completed in %s |%s| %s"%(diff, msg, tname), important=True)

def set_log(fname):
    global LOG_FILE
    LOG_FILE = open(fname, "a")

def close_log():
    global LOG_FILE
    from cantools import config
    if LOG_FILE:
        LOG_FILE.close()
        LOG_FILE = None
    config.log.deep and closedeeps()

DLZ = {}

def closedeeps():
    for group in DLZ:
        for dl in DLZ[group]:
            DLZ[group][dl].close()
        del DLZ[group]

def deeplog(group, sub):
    gpath = os.path.join("logs", group)
    if group not in DLZ:
        DLZ[group] = {}
    if sub not in DLZ[group]:
        if "(" in sub:
            variety, name = sub[:-1].split("(")
            gpath = os.path.join(gpath, variety)
        else:
            name = sub
        if not os.path.exists(gpath):
            from .system import mkdir
            mkdir(gpath, True)
        fullp = os.path.join(gpath,
            "%s.log"%(''.join([s for s in name if s.isalnum()]),))
        print("initializing", fullp)
        DLZ[group][sub] = open(fullp, "a")
    return DLZ[group][sub]

def log(msg, level=0, important=False, group=None, sub=None):
    from cantools import config
    s = "%s%s"%("  " * level, msg)
    if config.log.timestamp:
        s = "* %s : %s"%(datetime.now(), s)
    if important:
        s = "\n%s"%(s,)
    ws = "%s\n"%(s,)
    if LOG_FILE:
        LOG_FILE.write(ws)
    if group and sub and config.log.deep:
        deeplog(group, sub).write(ws)
    print(s)

def set_error(f):
    global ERROR_CB
    ERROR_CB = f

def error(msg, *lines):
    log("error: %s"%(msg,), important=True)
    for line in lines:
        log(line, 1)
    log("goodbye")
    if ERROR_CB:
        ERROR_CB(msg)
    else:
        sys.exit()