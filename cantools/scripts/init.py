import os
from optparse import OptionParser
from util import log, write
from config import config

def log_write(content, fname):
	log("writing %s"%(fname,), 2)
	write(content, fname)

def log_sym(src, dest):
	log("symlinking %s to %s"%(src, dest), 2)
	os.symlink(src, dest)

def log_mkdir(pname):
	log("new directory: %s"%(pname,), 2)
	os.mkdir(pname)

def makeproj(pname, cantools_path):
	log("Initializing Project: %s"%(pname,))
	log("building directories", 1)
	log_mkdir(pname)
	os.chdir(pname)
	log_mkdir("js")
	log_mkdir("html")
	log("generating configuration", 1)
	log_write(config.init.yaml%(pname,), "app.yaml")
	log_write(config.init.ctcfg, "ctcfg.py")
	log("demo index page", 1)
	log_write(config.init.html%(pname,), os.path.join("html", "index.html"))
	log("creating symlinks", 1)
	ctroot = os.path.join(cantools_path, "cantools", "cantools")
	log_sym(ctroot, "cantools")
	log_sym(os.path.join(ctroot, "CT"), os.path.join("js", "CT"))
	log_sym(os.path.join(ctroot, "css", "ct.css"), os.path.join("html", "ct.css"))
	log("done! goodbye.", 1)

def parse_and_make():
	parser = OptionParser("ctinit [projname] [--cantools_path=PATH]")
	parser.add_option("-c", "--cantools_path", dest="cantools_path", default=os.environ["HOME"],
		help="where is cantools? (default: %s)"%(os.environ["HOME"],))
	options, args = parser.parse_args()
	makeproj(len(args) and args[0] or raw_input("project name? "), options.cantools_path)

if __name__ == "__main__":
	parse_and_make()