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
    import sys
    sys.exit()

def read(fname="_tmp", lines=False):
    f = open(fname, "r")
    if lines:
        text = f.readlines()
    else:
        text = f.read()
    f.close()
    return text

def write(text, fname="_tmp"):
    f = open(fname, "w")
    f.write(text)
    f.close()