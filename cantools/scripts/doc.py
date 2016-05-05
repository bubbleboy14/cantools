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
	log(mod, 2)
	ds = read(os.path.join(CTPATH, mod))[3:].split("\n*/")[0]
	return "## CT.%s\n%s"%(mod, ds)

def back():
	log("back", 1)
	return ["# Back (CLI)"] + map(lambda cmd : dsBack(cmd),
		["init", "start", "deploy", "pubsub", "index"])

def front():
	log("front", 1)
	return ["# Front (JS Library)"] + map(lambda mod : dsFront(mod),
		filter(lambda i : i.endswith("js"), os.listdir(CTPATH)))

def build():
	log("building docs")
	ds = [config.about%(__version__,)]
	ds.extend(back())
	ds.extend(front())
	write("\n\n".join(ds), os.path.join("..", "..", "README.md"))

if __name__ == "__main__":
	build()