import commands, os, subprocess, platform
from reporting import log
from io import write

def cp(content, fname): # more write than copy, buuuut...
	log("writing %s"%(fname,), 2)
	write(content, fname)

def _init_win_sym():
	def win_sym(src, dest):
		mode = os.path.isdir(src) and "J" or "H"
		cmd("mklink /%s %s %s"%(mode, dest, src))
	os.symlink = win_sym

def sym(src, dest, safe=False):
	log("symlinking %s to %s"%(src, dest), 2)
	if not hasattr(os, "symlink"):
		_init_win_sym()
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

def mkdir(pname, recursive=False):
	log("new directory: %s"%(pname,), 2)
	if recursive:
		os.makedirs(pname)
	else:
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

def cmd(cline, sudo=False):
	if sudo and platform.system() is not "Windows":
		cline = "sudo %s"%(cline,)
	log('issuing command: "%s"'%(cline,), 2)
	subprocess.call(cline, shell=True)

def output(cline, silent=False):
	silent or log('getting output for: "%s"'%(cline,), 2)
	return commands.getoutput(cline)