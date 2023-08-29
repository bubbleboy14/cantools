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

def deeplog(logname, subname):
    dpath = os.path.join("logs", logname)
    os.path.exists(dpath) or os.mkdir(dpath)
    if logname not in DLZ:
        DLZ[logname] = {}
    if subname not in DLZ[logname]:
        fullp = os.path.join(dpath,
            "%s.log"%(''.join([s for s in subname if s.isalnum()]),))
        print("initializing", fullp)
        DLZ[logname][subname] = open(fullp, "a")
    return DLZ[logname][subname]

def log(msg, level=0, important=False, logname=None, subname=None):
    from cantools import config
    s = "%s%s"%("  " * level, msg)
    if config.log.timestamp:
        s = "* %s : %s"%(datetime.now(), s)
    if important:
        s = "\n%s"%(s,)
    ws = "%s\n"%(s,)
    if LOG_FILE:
        LOG_FILE.write(ws)
    if logname and subname and config.log.deep:
        deeplog(logname, subname).write(ws)
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