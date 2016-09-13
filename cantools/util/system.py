import os, subprocess
from reporting import log
from io import write

def cp(content, fname): # more write than copy, buuuut...
	log("writing %s"%(fname,), 2)
	write(content, fname)

def sym(src, dest, safe=False):
	log("symlinking %s to %s"%(src, dest), 2)
	try:
		os.symlink(src, dest)
	except Exception, e:
		log("symlinking failed (%s) - file exists: %s"%(e, dest), 3)
		if not safe:
			try:
				rm(dest)
				sym(src, dest, True)
			except:
				log("ok, really failed - skipping", 3)

def mkdir(pname):
	log("new directory: %s"%(pname,), 2)
	os.mkdir(pname)

def rm(pname):
	if os.path.islink(pname):
		log("removing symlink: %s"%(pname,), 2)
		os.remove(pname)
	elif os.path.isdir(pname):
		log("removing folder: %s"%(pname,), 2)
		os.rmdir(pname)
	elif os.path.exists(pname):
		log("removing file: %s"%(pname,), 2)
		os.remove(pname)
	else:
		log("can't remove file (doesn't exist): %s"%(pname,), 2)

def cmd(cline):
	log('issuing command: "%s"'%(cline,), 2)
	subprocess.call(cline, shell=True)