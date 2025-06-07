import os, sys, subprocess, platform
try:
	from commands import getoutput   # py2
except:
	from subprocess import getoutput # py3
from .reporting import log
from .io import read, write

def cp(content, fname): # more write than copy, buuuut...
	log("writing %s"%(fname,), 2)
	write(content, fname, binary=hasattr(content, "decode"))

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
	except Exception as e:
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

def sed(fname, flag, replacement, target=None):
	write(read(fname).replace(flag, replacement), target or fname)

def sudoed(cline, sudo=False):
	if sudo and platform.system() != "Windows" and os.geteuid(): # !root
		cline = "sudo %s"%(cline,)
	return cline

def cmd(cline, sudo=False, silent=False):
	cline = sudoed(cline, sudo)
	silent or log('issuing command: "%s"'%(cline,), 2)
	subprocess.call(cline, shell=True)

def output(cline, sudo=False, silent=False, loud=False):
	cline = sudoed(cline, sudo)
	silent or log('getting output for: "%s"'%(cline,), 2)
	output = getoutput(cline)
	loud and log(output)
	return output

def envget(name):
	return output("echo $%s"%(name,))

def envset(name, val):
	os.environ[name] = val
	#cmd("export %s=%s"%(name, val))

PYVER = sys.version_info[0] == 2 and "python" or "python3"

def py(cline, sudo=False):
	cmd("%s %s"%(PYVER, cline), sudo)

def pymod(mod, sudo=False):
	py("-m %s"%(mod,), sudo)

def indir(data, path):
	for f in [os.path.join(path, p) for p in os.listdir(path)]:
		if os.path.isfile(f) and data == read(f, binary=True):
			return os.path.split(f)[-1]