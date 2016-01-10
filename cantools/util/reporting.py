import sys
from datetime import datetime

def log(msg, level=0, important=False):
    if important:
        print
    print "* %s : %s %s"%(datetime.now(), "  " * level, msg)

def error(msg, *lines):
    log("error: %s"%(msg,), important=True)
    for line in lines:
        log(line, 1)
    log("goodbye")
    sys.exit()