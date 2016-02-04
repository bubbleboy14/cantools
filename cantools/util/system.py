import os
from reporting import log
from io import write

def cp(content, fname): # more write than copy, buuuut...
	log("writing %s"%(fname,), 2)
	write(content, fname)

def sym(src, dest):
	log("symlinking %s to %s"%(src, dest), 2)
	try:
		os.symlink(src, dest)
	except Exception, e:
		log("symlinking failed (%s)"%(e,), 3)

def mkdir(pname):
	log("new directory: %s"%(pname,), 2)
	os.mkdir(pname)