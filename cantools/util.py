import os
from datetime import datetime

#
# reporting
#

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

#
# io
#

def read(fname="_tmp", lines=False):
    try:
        f = open(fname, "r")
    except Exception, e:
        if lines:
            return []
        return None
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

#
# system
#

def cp(content, fname): # more write than copy, buuuut...
    log("writing %s"%(fname,), 2)
    write(content, fname)

def sym(src, dest):
    log("symlinking %s to %s"%(src, dest), 2)
    os.symlink(src, dest)

def mkdir(pname):
    log("new directory: %s"%(pname,), 2)
    os.mkdir(pname)