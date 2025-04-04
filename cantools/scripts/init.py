"""
### Usage: ctinit [projname] [-ru] [--plugins=P1|P2|P3] [--cantools_path=PATH] [--web_backend=BACKEND]

### Options:
    -h, --help            show this help message and exit
    -p PLUGINS, --plugins=PLUGINS
                          which plugins would you like to use in your project?
    -c CANTOOLS_PATH, --cantools_path=CANTOOLS_PATH
                          where is cantools? (default: /guessed/path/from/__file__)
    -w WEB_BACKEND, --web_backend=WEB_BACKEND
                          web backend. options: dez, gae. (default: dez)
    -r, --refresh_symlinks
                          add symlinks to project, create any missing directories,
                          and configure version control path exclusion (if desired)
    -u, --update          update cantools and all managed plugins
    -a, --admin           compile admin pages [ctdev only]

NB: it may be necessary to specify --cantools_path. Normally, this is derived from
the __file__ property (the location of the ctinit script, init.py). However, if the
package lives in your Python dist-packages (as with 'easy_install', as well as
'setup.py install', and now even 'pip3 install'), it does not contain the client-side
files necessary for an end-to-end web application, and these files therefore cannot be
symlinked into your new project. In these cases, indicate --cantools_path (the path to
the cloned cantools repository on your computer), and everything should work fine.

Generally speaking, one should clone the cantools github repository, 'setup.py install'
it (for the 'ct' commands), and then run 'setup.py develop' - actually now instead of
setup.py anything, just use pip3 install -e - which will point 'cantools' at your cloned
cantools repo and keep the package up to date as you periodically 'git pull' the latest
version. Similarly, plugins should be kept in 'develop' mode, as they also will generally
have non-python files of consequence.

In most cases, the developer won't have to pay much attention to this stuff, because
initializing or refreshing a project will automatically install any necessary plugins
that aren't already present. Similarly, the --update flag pulls down the latest versions
of cantools and all managed plugins. Thus, plugins are dealt with under the hood without
any need for the developer to know or do anything beyond 'ctinit -r'.
"""

import os, sys
from optparse import OptionParser
from fyg.util import confirm
from cantools import config, include_plugin, mods_and_repos
from cantools.util import log, error, cp, sym, mkdir, rm, py, cmd, output, read
from cantools.util.package import pipper, refresh_plugins
from cantools.util.admin import install
from .builder import build_all

try:
    input = raw_input # py2/3 compatibility
except NameError:
    pass

CTP = __file__.rsplit(os.path.sep, 2)[0]

class Builder(object):
	def __init__(self, pname=None, cantools_path=CTP, web_backend="dez", refresh_symlinks=False, install_dependencies=False):
		if not pname and not refresh_symlinks:
			pname = input("project name? ")
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
		self.install_dependencies = install_dependencies
		self.plugins = {}
		self.pipper = None
		self.installed = set()
		self.install_sysdeps()
		self.install_plugins()
		if refresh_symlinks:
			self.plugdirs()
		else:
			self.build_dirs()
			self.make_files()
		self.vcignore()
		self.generate_symlinks()

	def _install(self, repo):
		log("Building Package: %s"%(repo,), important=True)
		self.pipper = self.pipper or pipper()
		curdir = os.getcwd()
		if not os.path.isdir(config.plugin.path):
			mkdir(config.plugin.path)
		os.chdir(config.plugin.path)
		log("cloning repository", important=True)
		plug = repo.split("/")[1]
		cmd("git clone https://github.com/%s.git"%(repo,))
		os.chdir(plug)
		log("installing plugin", important=True)
#		cmd("python setup.py install", True) # unnecessary right?
#		py("setup.py develop", True)
		self.pipper()
#		os.chdir("%s/.."%(self.ctroot,))
#		log("restoring cantools develop status", important=True)
#		py("setup.py develop", True)
		os.chdir(curdir)
		sys.path.insert(0, os.path.join(config.plugin.path, plug))
		self._getplug(plug)

	def _update(self, cfg, prop, lines):
		cfg.update(prop, "%s\r\n%s"%(cfg[prop], "\r\n".join(lines)))

	def _getplug(self, plugin):
		log("Installing Plugin: %s"%(plugin,), important=True)
		mod = self.plugins[plugin] = __import__(plugin)
		mod.__ct_mod_path__ = mod.__file__.rsplit(os.path.sep, 1)[0]
		init = mod.init
		jscc = os.path.join(mod.__ct_mod_path__, "js", "config.js")
		ctab = os.path.join(mod.__ct_mod_path__, "cron.yaml")
		if os.path.isfile(jscc):
			log("adding custom config entries to core.config (js)", 3)
			config.init.config.update(plugin, read(jscc, isjson=True))
		if os.path.isfile(ctab):
			log("adding custom cron schedule", 3)
			config.init.update("cron", "%s\n\n%s"%(config.init.cron, read(ctab)))
		if hasattr(init, "util"):
			log("adding post instructions to core.util (js)", 3)
			self._update(config.init.util, "post", [init.util])
		if hasattr(init, "model"):
			log("adding %s imports to model"%(len(init.model),), 3)
			self._update(config.init, "model", ["from %s import %s"%(m,
				", ".join(k)) for (m, k) in list(init.model.items())])
		if hasattr(init, "routes"):
			log("adding %s routes to app.yaml"%(len(init.routes),), 3)
			self._update(config.init.yaml, "core", ["- url: %s\r\n  %s: %s"%(u,
				s.endswith(".py") and "script" or "static_dir", s) for (u,
				s) in list(init.routes.items())])
		if hasattr(init, "requires"):
			log("installing %s ct dependencies"%(len(init.requires),), 3)
			self._getplugs(*mods_and_repos(init.requires))
		if self.install_dependencies and hasattr(init, "dependencies"):
			log("installing %s system dependencies"%(len(init.dependencies),), 3)
			install(*init.dependencies)

	def _getplugs(self, plugs, repos=None):
		for i in range(len(plugs)):
			plugin = plugs[i]
			log("Plugin: %s"%(plugin,), 2)
			if plugin in self.installed:
				log("already installed :)", 3)
				continue
			try:
				self._getplug(plugin)
			except ImportError:
				log("plugin '%s' not found! attempting install."%(plugin,), important=True)
				self._install((repos or config.plugin.repos)[i])
			self.installed.add(plugin)

	def install_plugins(self):
		pil = len(config.plugin.modules)
		if pil:
			log("Installing %s Plugins"%(pil,), 1)
			self._getplugs(config.plugin.modules)

	def install_sysdeps(self):
		dlen = len(config.build.dependencies)
		if dlen and self.install_dependencies:
			log("Installing %s System Dependencies"%(dlen,), 1)
			install(*config.build.dependencies)

	def plugdirs(self):
		log("Building Directories for %s Plugins"%(len(list(self.plugins.keys())),), important=True)
		for mod in list(self.plugins.values()):
			if hasattr(mod.init, "dirs"):
				for d in mod.init.dirs:
					if os.path.exists(d):
						log("already exists: %s"%(d,))
					else:
						mkdir(d)

	def build_dirs(self):
		log("building directories", 1)
		mkdir(self.pname)
		os.chdir(self.pname)
		for d in config.init.dirs:
			mkdir(d)
		jsc = os.path.join(config.js.path, "core")
		mkdir(jsc)
		mkdir("emails")
		if self.plugins:
			self.plugdirs()

	def make_files(self):
		log("generating configuration", 1)
		cp((self.web_backend == "gae") and "%s\r\n%s"%(config.init.yaml.gae,
			config.init.yaml.core)%(self.pname,) or config.init.yaml.core, "app.yaml")
		cfg = config.init.ctcfg%(self.web_backend,)
		if self.plugins:
			cfg = os.linesep.join([cfg, "PLUGIN_MODULES = %s"%("|".join([r.replace("%s/"%(config.plugin.base,), "") for r in config.plugin.repos]),)])
		cp(cfg, "ct.cfg")
		log("demo index page", 1)
		cp(config.init.html%(self.pname,), os.path.join("html", "index.html"))
		log("model", 1)
		cp(config.init.model, "model.py")
		log("cron", 1)
		cp(config.init.cron, "cron.yaml")
		jsc = os.path.join(config.js.path, "core.js")
		jscc = os.path.join(config.js.path, "core", "config.js")
		jscu = os.path.join(config.js.path, "core", "util.js")
		log("Building core js files: %s, %s, %s"%(jsc, jscc, jscu), important=True)
		cp(os.linesep.join(config.init.core), jsc)
		cp("core.config = %s;"%(config.init.config.json(),), jscc)
		cp(config.init.util.template%(config.init.util.main.json(), config.init.util.post), jscu)
		log("Copying files from plugins", important=True)
		for plugin, mod in list(self.plugins.items()):
			if hasattr(mod.init, "templates"):
				log("email templates [%s]: %s"%(plugin, mod.init.templates), 1, important=True)
				cp(read(os.path.join(mod.__ct_mod_path__, mod.init.templates)),
					os.path.join("emails", mod.init.templates))
			if hasattr(mod.init, "copies"):
				for dname, fnames in list(mod.init.copies.items()):
					dp = os.path.join(mod.__ct_mod_path__, dname)
					if fnames == "*":
						log("copying contents of %s/%s to %s"%(plugin, dname, dname), 1)
						cmd("cp -r %s %s"%(os.path.join(dp, "*"), dname))
					else:
						for fname in fnames:
							log("%s [%s]"%(fname, plugin), 1)
							cp(read(os.path.join(dp, fname), binary=True),
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
		sym(ctp, os.path.join(config.js.path, "CT"))
		sym(os.path.join(self.ctroot, "css", "ct.css"), os.path.join("css", "ct.css"))
		sym(os.path.join(self.ctroot, "admin"), "_")
		sym(os.path.join(self.ctroot, "admin.py"), "admin.py")
		sym(os.path.join(self.ctroot, "_db.py"), "_db.py")
		sym(os.path.join(self.ctroot, "_memcache.py"), "_memcache.py")
		sym(os.path.join(self.ctroot, "_pay.py"), "_pay.py")
		for mod in list(self.plugins.values()):
			if hasattr(mod.init, "syms"):
				for dname, fnames in list(mod.init.syms.items()):
					for fname in fnames:
						sym(os.path.join(mod.__ct_mod_path__, dname, fname),
							os.path.join(dname, fname))

	def vcignore(self):
		log("configuring version control path exclusion", 1)
		for plugin, mod in list(self.plugins.items()):
			if hasattr(mod.init, "syms"):
				log("loading rules for plugin: %s"%(plugin,), 2)
				for dname, fnames in list(mod.init.syms.items()):
					for fname in fnames:
						if not config.init.vcignore[dname]:
							config.init.vcignore.update(dname, [])
						config.init.vcignore[dname].append(fname)
			else:
				log("no symlinks - skipping plugin: %s"%(plugin,), 2)
		itype = input("would you like to generate exclusion rules for symlinks and dot files (if you select svn, we will add the project to your repository first)? [NO/git/svn] ")
		config.init.vcignore.update(config.js.path, config.init.vcignore.js)
		if itype == "git":
			log("configuring git", 2)
			cfg = config.init.vcignore["."]
			for path in [p for p in list(config.init.vcignore.keys()) if p != "."]:
				for fname in config.init.vcignore[path]:
					cfg.append(os.path.join(path, fname))
			cp("\n".join(cfg), ".gitignore")
		elif itype == "svn":
			log("configuring svn", 2)
			cmd("svn add .")
			for root, files in list(config.init.vcignore.items()):
				cp("\n".join(files), "_tmp")
				cmd("svn propset svn:ignore -F _tmp %s"%(root,))
				rm("_tmp")

def update(autodeps=False):
	log("Updating cantools and managed plugins", important=True)
	os.chdir(CTP)
	log("retrieving latest cantools", 1)
	pullout = output("git pull", loud=True)
	if os.path.isdir(config.plugin.path):
		dname, dirs, files = next(os.walk(config.plugin.path))
		log("updating %s managed plugins"%(len(dirs),), 1)
		for d in dirs:
			os.chdir(os.path.join(config.plugin.path, d))
			log("retrieving latest %s"%(d,), 2)
			cmd("git pull")
	log("finished updates", 1)
	if autodeps:
		dodeps = "setup.py" in pullout
		dodeps and log("setup file has changed!", important=True)
	else:
		dodeps = confirm("update cantools dependencies")
	if dodeps:
		os.chdir("%s/.."%(CTP,))
		log("updating dependencies", important=True)
		pipper(execute=True, force=autodeps)

def admin():
	log("compiling admin pages -- thanks for developing!!", important=True)
	os.chdir(os.path.join(CTP, "admin"))
	build_all("admin", CTP)
	log("finished compilation")

def parse_and_make():
	parser = OptionParser("ctinit [projname] [-ru] [--plugins=P1|P2|P3] [--cantools_path=PATH] [--web_backend=BACKEND]")
	parser.add_option("-p", "--plugins", dest="plugins", default="",
		help="which plugins would you like to use in your project?")
	parser.add_option("-c", "--cantools_path", dest="cantools_path", default=CTP,
		help="where is cantools? (default: %s)"%(CTP,))
	parser.add_option("-w", "--web_backend", dest="web_backend", default="dez",
		help="web backend. options: dez, gae. (default: dez)")
	parser.add_option("-r", "--refresh_symlinks", action="store_true", dest="refresh_symlinks", default=False,
		help="add symlinks to project, create any missing directories, and configure version control path exclusion (if desired)")
	parser.add_option("-i", "--install_dependencies", action="store_true", dest="install_dependencies",
		default=False, help="install (via system package manager) non-Python dependencies")
	parser.add_option("-u", "--update", action="store_true",
		dest="update", default=False, help="update cantools and all managed plugins")
	parser.add_option("-d", "--deps", action="store_true",
		dest="deps", default=False, help="install dependencies if setup file has changed")
	parser.add_option("-a", "--admin", action="store_true",
		dest="admin", default=False, help="compile admin pages [ctdev only]")
	options, args = parser.parse_args()
	if options.update:
		update(options.deps)
	elif options.admin:
		admin()
	elif options.plugins == "refresh":
		refresh_plugins()
	else:
		if options.plugins:
			for p in options.plugins.split("|"):
				include_plugin(p)
		Builder(len(args) and args[0], options.cantools_path, options.web_backend,
			options.refresh_symlinks, options.install_dependencies)
	log("done! goodbye.")

if __name__ == "__main__":
	parse_and_make()