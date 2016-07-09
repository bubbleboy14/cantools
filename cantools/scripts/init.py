"""
### Usage: ctinit [projname] [-r] [--plugins=P1|P2|P3] [--cantools_path=PATH] [--web_backend=BACKEND]

### Options:
    -h, --help            show this help message and exit
    -p PLUGINS, --plugins=PLUGINS
                          which plugins would you like to use in your project?
    -c CANTOOLS_PATH, --cantools_path=CANTOOLS_PATH
                          where is cantools? (default: /guessed/path/from/__file__)
    -w WEB_BACKEND, --web_backend=WEB_BACKEND
                          web backend. options: dez, gae. (default: dez)
    -r, --refresh_symlinks
                          add symlinks to project and configure version control
                          path exclusion (if desired)

NB: it may be necessary to specify --cantools_path. Normally, this is derived from
the __file__ property (the location of the ctinit script, init.py). However, if the
package lives in your Python dist-packages (as with 'easy_install', as well as
'setup.py install'), it does not contain the client-side files necessary for an
end-to-end web application, and these files therefore cannot be symlinked into your
new project. In these cases, indicate --cantools_path (the path to the cloned cantools
repository on your computer), and everything should work fine.
"""

import os
from optparse import OptionParser
from cantools import config
from cantools.util import log, error, cp, sym, mkdir, rm, cmd, read

CTP = __file__.rsplit(os.path.sep, 2)[0]

class Builder(object):
	def __init__(self, pname=None, cantools_path=CTP, web_backend="dez", refresh_symlinks=False):
		if not pname and not refresh_symlinks:
			pname = raw_input("project name? ")
		log("Initializing %s Project: %s"%(web_backend, pname or "(refresh)"))
		self.pname = pname
		self.ctroot = cantools_path
		if not os.path.exists(self.ctroot):
			error("failed to establish cantools root",
				"We tried: %s"%(self.ctroot,),
				"This directory does not contain cantools.",
				"You can download cantools at https://github.com/bubbleboy14/cantools",
				"Please pass the path to your local copy of cantools via the -c flag."
			)
		self.web_backend = web_backend
		self.refresh_symlinks = refresh_symlinks
		self.plugins = {}
		self.install_plugins()
		if not refresh_symlinks:
			self.build_dirs()
			self.make_files()
		self.vcignore()
		self.generate_symlinks()
		log("done! goodbye.", 1)

	def install_plugins(self):
		pil = len(config.plugins)
		if pil:
			log("Installing %s Plugins"%(pil,), 1)
			for plugin in config.plugins:
				log(plugin, 2)
				try:
					mod = self.plugins[plugin] = __import__(plugin)
					mod.__ct_mod_path__ = mod.__file__.rsplit(os.path.sep, 1)[0]
				except ImportError:
					cmd("easy_install %s"%(plugin,))

	def build_dirs(self):
		log("building directories", 1)
		mkdir(self.pname)
		os.chdir(self.pname)
		for d in config.init.dirs:
			mkdir(d)
		for mod in self.plugins.values():
			for d in mod.init.dirs:
				mkdir(d)

	def make_files(self):
		log("generating configuration", 1)
		cp((self.web_backend == "gae") and "%s\r\n%s"%(config.init.yaml.gae,
			config.init.yaml.core)%(self.pname,) or config.init.yaml.core, "app.yaml")
		cfg = config.init.ctcfg%(self.web_backend,)
		if self.plugins:
			cfg = os.linesep.join([cfg, "PLUGINS = %s"%("|".join(self.plugins.keys()),)])
		cp(cfg, "ct.cfg")
		log("demo index page", 1)
		cp(config.init.html%(self.pname,), os.path.join("html", "index.html"))
		log("model", 1)
		cp(config.init.model, "model.py")
		for plugin, mod in self.plugins.items():
			for dname, fnames in mod.init.copies.items():
				for fname in fnames:
					log("%s [%s]"%(fname, plugin), 1)
					cp(read(os.path.join(mod.__ct_mod_path__, dname, fname)),
						os.path.join(dname, fname))

	def generate_symlinks(self):
		log("creating symlinks", 1)
		if self.refresh_symlinks:
			for d in config.init.dirs:
				if not os.path.isdir(d):
					mkdir(d)
		if self.web_backend == "gae":
			sym(self.ctroot, "cantools")
		ctp = os.path.join(self.ctroot, "CT")
		sym(ctp, os.path.join("js", "CT"))
		sym(ctp, os.path.join("html-production", "CT"))
		sym(os.path.join(self.ctroot, "css", "ct.css"), os.path.join("css", "ct.css"))
		sym(os.path.join(self.ctroot, "admin"), "_")
		sym(os.path.join(self.ctroot, "admin.py"), "admin.py")
		sym(os.path.join(self.ctroot, "_db.py"), "_db.py")
		sym(os.path.join(self.ctroot, "_pay.py"), "_pay.py")
		for mod in self.plugins.values():
			for dname, fnames in mod.init.syms.items():
				for fname in fnames:
					sym(os.path.join(mod.__ct_mod_path__, dname, fname),
						os.path.join(dname, fname))

	def vcignore(self):
		log("configuring version control path exclusion", 1)
		for plugin, mod in self.plugins.items():
			log("loading rules for plugin: %s"%(plugin,), 2)
			for dname, fnames in mod.init.syms.items():
				for fname in fnames:
					if not config.init.vcignore[dname]:
						config.init.vcignore.update(dname, [])
					config.init.vcignore[dname].append(fname)
		itype = raw_input("would you like to generate exclusion rules for symlinks and dot files (if you select svn, we will add the project to your repository first)? [NO/git/svn] ")
		if itype == "git":
			log("configuring git", 2)
			cfg = config.init.vcignore["."]
			for path in [p for p in config.init.vcignore.keys() if p != "."]:
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
	parser = OptionParser("ctinit [projname] [-r] [--plugins=P1|P2|P3] [--cantools_path=PATH] [--web_backend=BACKEND]")
	parser.add_option("-p", "--plugins", dest="plugins", default="",
		help="which plugins would you like to use in your project?")
	parser.add_option("-c", "--cantools_path", dest="cantools_path", default=CTP,
		help="where is cantools? (default: %s)"%(CTP,))
	parser.add_option("-w", "--web_backend", dest="web_backend", default="dez",
		help="web backend. options: dez, gae. (default: dez)")
	parser.add_option("-r", "--refresh_symlinks", action="store_true",
		dest="refresh_symlinks", default=False, help="add symlinks to project and configure version control path exclusion (if desired)")
	options, args = parser.parse_args()
	if options.plugins:
		config.update("plugins", list(set(config.plugins + options.plugins.split("|"))))
	Builder(len(args) and args[0], options.cantools_path,
		options.web_backend, options.refresh_symlinks)

if __name__ == "__main__":
	parse_and_make()