import os
from optparse import OptionParser
from util import log, write
from config import config

def makeproj(pname, cantools_path):
	log("Initializing Project: %s"%(pname,))
	log("building directories", 1)
	os.mkdir(pname)
	os.chdir(pname)
	os.mkdir("js")
	os.mkdir("html")
	log("generating configuration", 1)
	write(config.init.yaml%(pname,), "app.yaml")
	write(config.init.ctcfg, "ctcfg.py")
	write(config.init.css, os.path.join("html", "ct.css"))
	log("creating symlinks", 1)
	ctroot = os.path.join(cantools_path, "cantools", "cantools")
	os.symlink(ctroot, "cantools")
	os.symlink(os.path.join(ctroot, "CT"), os.path.join("js", "CT"))
	log("done! goodbye.", 1)

def parse_and_make():
	parser = OptionParser("ctinit [projname] [--cantools_path=PATH]")
	parser.add_option("-c", "--cantools_path", dest="cantools_path", default=os.environ["HOME"],
		help="where is cantools? (default: %s)"%(os.environ["HOME"],))
	options, args = parser.parse_args()
	makeproj(len(args) and args[0] or raw_input("project name? "), options.cantools_path)

if __name__ == "__main__":
	parse_and_make()