import sys
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
    if LOG_FILE:
        LOG_FILE.close()
        LOG_FILE = None

def log(msg, level=0, important=False):
    s = "* %s : %s %s"%(datetime.now(), "  " * level, msg)
    if important:
        s = "\n%s"%(s,)
    if LOG_FILE:
        LOG_FILE.write("%s\n"%(s,))
    print s

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