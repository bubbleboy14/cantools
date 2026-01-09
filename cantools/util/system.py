import os, sys
from fyg.util import log, read, write, rm, sudoed, cmd, output

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

def sed(fname, flag, replacement, target=None):
	write(read(fname).replace(flag, replacement), target or fname)

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