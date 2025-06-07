import os
from fyg.util import confirm, selnum
from cantools.util import log, cmd, output, mkdir, cp
from cantools.util.admin import _which, javaver
from .data import TEMPLATES

def ask(question, default=None):
	q = "%s? "%(question,)
	if default:
		q = "%s [default: %s] "%(q, default)
	return input(q) or default

class Android(object):
	def __init__(self, name, package, url):
		self.url = url
		self.name = name
		self.package = package
		self.dir = package.replace(".", "/")
		self.tmps = TEMPLATES["android"]
		self.bmode = "debug"
		self.dirs()
		self.files()
		self.icons()
		os.chdir(self.name)
		self.apk()
		self.install()
		log("goodbye")

	def dirs(self):
		if not confirm("assemble directory hierarchy", True): return
		mkdir("%s/src/main/java/%s"%(self.name, self.dir), True)
		mkdir("%s/src/main/res"%(self.name,))

	def files(self):
		if not confirm("create project files", True): return
		jv = javaver()
		cp(self.tmps["manifest"]%(self.name, self.name, self.name),
			"%s/src/main/AndroidManifest.xml"%(self.name))
		cp(self.tmps["activity"]%(self.package, self.url),
			"%s/src/main/java/%s/MainActivity.java"%(self.name, self.dir))
		cp(self.tmps["gradle"]%(self.package, jv, jv),
			"%s/build.gradle"%(self.name,))

	def icons(self):
		if not confirm("generate icons", True): return
		ipath = ask("image path", "icon.png")
		for k, v in self.tmps["isizes"].items():
			wpath = "%s/src/main/res/drawable-%s"%(self.name, k)
			mkdir(wpath)
			cmd(self.tmps["icons"]%(ipath, v, wpath))

	def apk(self):
		if not confirm("build apk", True): return
		self.debug = selnum(["debug", "release"]) == "debug"
		gcmd = self.debug and "buildDebug" or "build"
		if confirm("add stacktrace flag (recommended)", True):
			gcmd = "%s --stacktrace"%(gcmd,)
		if confirm("specify trustStore cacerts", True):
			tsca = selnum(output("locate cacerts | grep java").split("\n"))
			tspw = ask("trustStore password", "changeit")
			gcmd = self.tmps["tstore"]%(gcmd, tsca, tspw)
		cmd("gradle %s"%(gcmd,))

	def install(self):
		if not confirm("install on device"): return
		aname = self.debug and "%s-debug"%(self.name,) or self.name
		cmd("adb install build/outputs/apk/%s.apk"%(aname,))

def android(url=None):
	if not _which("convert", "gradle", "adb"):
		return log("build aborted!")
	url = url or ask("url", "http://ct.mkult.co")
	if "://" not in url:
		url = "https://%s"%(url,)
	parts = url.split("://").pop().split("/").pop(0).split(".")
	parts.reverse()
	name = ask("name", parts[1])
	pname = ask("package name", ".".join(parts))
	Android(name, pname, url)