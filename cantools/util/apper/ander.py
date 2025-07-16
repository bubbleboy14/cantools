import os
from fyg.util import log, ask, confirm, selnum
from cantools.util import cmd, output, mkdir, cp
from cantools.util.system import envget, envset
from cantools.util.admin import _which, javaver
from .data import TEMPLATES

class Android(object):
	def __init__(self, url, name=None, package=None, auto=False):
		self.setVars(url, name, package, auto)
		self.setMode()
		self.dirs()
		self.files()
		self.icons()
		os.chdir(self.name)
		self.apk()
		self.install()
		log("goodbye")

	def setVars(self, url, name=None, package=None, auto=False):
		if "://" not in url:
			url = "https://%s"%(url,)
		parts = url.split("://").pop().split("/").pop(0).split(".")
		self.url = url
		self.auto = auto
		self.name = name or self.ask("name", parts[0])
		parts.reverse()
		self.package = package or self.ask("package name", ".".join(parts))
		self.dir = self.package.replace(".", "/")
		self.tmps = TEMPLATES["android"]

	def ask(self, question, default=None):
		if default and self.auto:
			log("question '%s' -> choosing '%s'"%(question, default), important=True)
			return default
		return ask(question, default)

	def conf(self, condition, default=False):
		if self.auto:
			log("confirmation '%s' -> deciding '%s'"%(condition, default), important=True)
			return default
		return confirm(condition, default)

	def setMode(self, mode="debug"):
		self.mode = mode
		self.debug = mode == "debug"

	def dirs(self):
		if not self.conf("assemble directory hierarchy", True): return
		mkdir("%s/src/main/java/%s"%(self.name, self.dir), True)
		mkdir("%s/src/main/res"%(self.name,))

	def files(self):
		if not self.conf("create project files", True): return
		self.jv = javaver()
		cp(self.tmps["manifest"]%(self.name, self.package, self.name),
			"%s/src/main/AndroidManifest.xml"%(self.name))
		cp(self.tmps["activity"]%(self.package, self.url),
			"%s/src/main/java/%s/MainActivity.java"%(self.name, self.dir))
		cp(self.tmps["gradle"]%(self.package, self.jv, self.jv),
			"%s/build.gradle"%(self.name,))
		cp(self.tmps["properties"], "%s/gradle.properties"%(self.name,))

	def icons(self):
		if not self.conf("generate icons", True): return
		ipath = self.ask("image path", "icon.png")
		for k, v in self.tmps["isizes"].items():
			wpath = "%s/src/main/res/drawable-%s"%(self.name, k)
			mkdir(wpath)
			cmd(self.tmps["icons"]%(ipath, v, wpath))

	def chenv(self):
		for name, cfg in self.tmps["env"].items():
			if not envget(name):
				log("%s not set!"%(name,))
				envset(name, self.ask("%s location"%(name,),
					output("locate %s"%(cfg["locater"].replace("_JV_",
						self.jv),)).split(cfg["splitter"]).pop(0)))

	def apk(self):
		if not self.conf("build apk", True): return
		self.chenv()
		self.setMode(selnum(["debug", "release"]))
		gcmd = self.debug and "assembleDebug" or "assemble"
		if self.conf("add stacktrace flag"):
			gcmd = "%s --stacktrace"%(gcmd,)
		if self.conf("specify trustStore cacerts", True):
			tsca = selnum(output("locate cacerts | grep java").split("\n"))
			tspw = self.ask("trustStore password", "changeit")
			gcmd = self.tmps["tstore"]%(gcmd, tsca, tspw)
		cmd("gradle %s"%(gcmd,))

	def install(self):
		if not self.conf("install on device", True): return
		aname = self.debug and "%s-debug"%(self.name,) or self.name
		cmd("adb install build/outputs/apk/%s/%s.apk"%(self.mode, aname))

def android(url=None, auto=False):
	if not _which("java", "gradle", "adb", "convert"):
		return log("build aborted!")
	Android(url or ask("url", "http://ct.mkult.co"), auto=auto)