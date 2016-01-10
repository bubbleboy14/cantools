import os
from reporting import log

def cp(content, fname): # more write than copy, buuuut...
    log("writing %s"%(fname,), 2)
    write(content, fname)

def sym(src, dest):
    log("symlinking %s to %s"%(src, dest), 2)
    os.symlink(src, dest)

def mkdir(pname):
    log("new directory: %s"%(pname,), 2)
    os.mkdir(pname)