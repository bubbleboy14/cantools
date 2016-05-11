"""
### Usage: ctinit [projname] [--cantools_path=PATH] [--web_backend=BACKEND]

### Options:
    -h, --help            show this help message and exit
    -c CANTOOLS_PATH, --cantools_path=CANTOOLS_PATH
                          where is cantools? (default: /your/home/directory)
    -w WEB_BACKEND, --web_backend=WEB_BACKEND
                          web backend. options: dez, gae. (default: dez)
    -r, --refresh_symlinks
                          add symlinks to project and configure version control
                          path exclusion (if desired)

TODO :: We shouldn't have to ask for --cantools_path. Instead, this
        path should be saved in an environment variable on install.
        Right? Could get complicated.
"""

import os
from optparse import OptionParser
from cantools import config
from cantools.util import log, error, cp, sym, mkdir, rm, cmd

HOME = os.environ.get("HOME", ".")

class Builder(object):
	def __init__(self, pname=None, cantools_path=HOME, web_backend="dez", refresh_symlinks=False):
		if not pname and not refresh_symlinks:
			pname = raw_input("project name? ")
		log("Initializing %s Project: %s"%(web_backend, pname or "(refresh)"))
		self.pname = pname
		self.ctroot = os.path.join(cantools_path, "cantools", "cantools")
		if not os.path.exists(self.ctroot):
			error("failed to establish cantools root",
				"We tried: %s"%(self.ctroot,),
				"This directory does not contain cantools.",
				"You can download cantools at https://github.com/bubbleboy14/cantools",
				"Please pass the path to your local copy of cantools via the -c flag."
			)
		self.web_backend = web_backend
		self.refresh_symlinks = refresh_symlinks
		if not refresh_symlinks:
			self.build_dirs()
			self.make_files()
		self.vcignore()
		self.generate_symlinks()
		log("done! goodbye.", 1)

	def build_dirs(self):
		log("building directories", 1)
		mkdir(self.pname)
		os.chdir(self.pname)
		mkdir("js")
		mkdir("css")
		mkdir("img")
		mkdir("html")
		mkdir("html-static")
		mkdir("html-production")
		mkdir("logs")

	def make_files(self):
		log("generating configuration", 1)
		cp((self.web_backend == "gae") and "%s\r\n%s"%(config.init.yaml.gae,
			config.init.yaml.core)%(self.pname,) or config.init.yaml.core, "app.yaml")
		cp(config.init.ctcfg%(self.web_backend,), "ct.cfg")
		log("demo index page", 1)
		cp(config.init.html%(self.pname,), os.path.join("html", "index.html"))
		log("model", 1)
		cp(config.init.model, "model.py")

	def generate_symlinks(self):
		log("creating symlinks", 1)
		if self.refresh_symlinks:
			if not os.path.isdir("js"):
				mkdir("js")
			if not os.path.isdir("css"):
				mkdir("css")
			if not os.path.isdir("img"):
				mkdir("img")
			if not os.path.isdir("logs"):
				mkdir("logs")
			lj = os.path.join("logs", "json")
			if not os.path.isdir(lj):
				mkdir(lj)
		if self.web_backend == "gae":
			sym(self.ctroot, "cantools")
		ctp = os.path.join(self.ctroot, "CT")
		sym(ctp, os.path.join("js", "CT"))
		sym(ctp, os.path.join("html-production", "CT"))
		sym(os.path.join(self.ctroot, "css", "ct.css"), os.path.join("css", "ct.css"))
		sym(os.path.join(self.ctroot, "admin"), "_")
		sym(os.path.join(self.ctroot, "admin.py"), "admin.py")
		sym(os.path.join(self.ctroot, "_db.py"), "_db.py")

	def vcignore(self):
		log("configuring version control path exclusion", 1)
		itype = raw_input("would you like to generate exclusion rules for symlinks and dot files (if you select svn, we will add the project to your repository first)? [NO/git/svn] ")
		if itype == "git":
			log("configuring git", 2)
			cfg = config.init.vcignore["."]
			for path in ["css", "js"]:
				for fname in config.init.vcignore[path]:
					cfg.append(os.path.join(path, fname))
			cp("\n".join(cfg), ".gitignore")
		elif itype == "svn":
			log("configuring svn", 2)
			cmd("svn add .")
			for root, files in config.init.vcignore.items():
				cp("\n".join(files), "_tmp")
				cmd("svn propset svn:ignore -F _tmp %s"%(root,))
				rm("_tmp")

def parse_and_make():
	parser = OptionParser("ctinit [projname] [--cantools_path=PATH] [--web_backend=BACKEND]")
	parser.add_option("-c", "--cantools_path", dest="cantools_path", default=HOME,
		help="where is cantools? (default: %s)"%(HOME,))
	parser.add_option("-w", "--web_backend", dest="web_backend", default="dez",
		help="web backend. options: dez, gae. (default: dez)")
	parser.add_option("-r", "--refresh_symlinks", action="store_true",
		dest="refresh_symlinks", default=False, help="add symlinks to project and configure version control path exclusion (if desired)")
	options, args = parser.parse_args()
	Builder(len(args) and args[0], options.cantools_path,
		options.web_backend, options.refresh_symlinks)

if __name__ == "__main__":
	parse_and_make()