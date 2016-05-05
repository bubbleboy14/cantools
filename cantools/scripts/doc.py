import os
from cantools import __version__, config
from cantools.util import read, write, log

CTPATH = os.path.join("..", "CT")
ALTS = {
	"pubsub": os.path.join("pubsub", "__init__")
}

def dsBack(cmd):
	cpath = "%s.py"%(ALTS.get(cmd, cmd),)
	log(cpath, 2)
	ds = read(cpath)[4:].split('\n"""')[0]
	return "## ct%s\n%s"%(cmd, ds)

def dsFront(mod):
	modname = "CT.%s"%(mod[:-3],)
	iline = mod == "ct.js" and '&lt;script src="/js/CT/ct.js"&gt;&lt;/script&gt;' or 'CT.require("%s");'%(modname,)
	log(modname, 2)
	return "\n".join([
		"## %s"%(modname,),
		"### Import line: '%s'"%(iline,),
		read(os.path.join(CTPATH, mod))[3:].split("\n*/")[0]
	])

def back():
	log("back", 1)
	return ["# Back (CLI)"] + map(lambda cmd : dsBack(cmd),
		["init", "start", "deploy", "pubsub", "index"])

def front():
	log("front", 1)
	plist = os.listdir(CTPATH)
	plist.sort()
	return ["# Front (JS Library)"] + map(lambda mod : dsFront(mod),
		filter(lambda i : i.endswith("js"), plist))

def build():
	log("building docs")
	ds = [config.about%(__version__,)]
	ds.extend(back())
	ds.extend(front())
	write("\n\n".join(ds), os.path.join("..", "..", "README.md"))

if __name__ == "__main__":
	build()