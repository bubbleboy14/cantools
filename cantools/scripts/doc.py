"""
### Usage: ctdoc

Run either from cantools root (contains setup.py, cantools/, README.md, etc) or
from root of plugin. In cantools, builds docs for all frontend (js) and CLI (py)
files. In plugin, docs consist of about file (about.txt), initialization config
(init.py) and default frontend config (js/config.js) (TODO: recursively include
full contents of js/ folder).
"""

import os
from cantools import __version__, config
from cantools.util import read, write, log

HERE = os.path.abspath(".").split(os.path.sep)[-1]
ISPLUGIN = HERE != "cantools" and HERE
ALTS = {
    "pubsub": os.path.join("pubsub", "__init__")
}
if ISPLUGIN:
    JSPATH = os.path.join(HERE, "js")
    BPATH = "."
    ALTS["init"] = os.path.join(ISPLUGIN, "init")
else:
    JSPATH = os.path.join(HERE, "CT")
    BPATH = os.path.join(HERE, "scripts")

def dsBack(cmd):
    cpath = os.path.join(BPATH, "%s.py"%(ALTS.get(cmd, cmd),))
    log(cpath, 2)
    bdata = read(cpath)
    if ISPLUGIN:
        return bdata
    else:
        ds = bdata[4:].split('\n"""')[0]
        return "## ct%s\n%s"%(cmd, ds)

def dsFront(mod, modname=None, iline=None):
    modname = modname or "CT.%s"%(mod[:-3],)
    iline = iline or (mod == "ct.js" and '&lt;script src="/js/CT/ct.js"&gt;&lt;/script&gt;' or 'CT.require("%s");'%(modname,))
    log(modname, 2)
    mdata = read(os.path.join(JSPATH, mod))
    return "\n".join([
        "## %s"%(modname,),
        "### Import line: '%s'"%(iline,),
        (ISPLUGIN and mod == "config.js") and mdata or mdata[3:].split("\n*/")[0]
    ])

def back():
    log("back", 1)
    if ISPLUGIN:
        return ["# Back (Init Config)", dsBack("init")]
    return ["# Back (CLI)"] + map(lambda cmd : dsBack(cmd), ["init", "start", "deploy", "pubsub", "migrate", "index", "doc"])

def front():
    log("front", 1)
    f = []
    if not ISPLUGIN:
        f.append("# Front (JS Library)")
        plist = os.listdir(JSPATH)
        plist.sort()
        f += map(lambda mod : dsFront(mod), filter(lambda i : i.endswith("js"), plist))
    elif os.path.isfile(os.path.join(JSPATH, "config.js")):
        f.append("# Front (JS Config)")
        f.append(dsFront("config.js", "core.config.%s"%(ISPLUGIN,), 'CT.require("core.config");'))
    return f

def build():
    log("building docs")
    ds = []
    if ISPLUGIN:
        ds.append("# %s\n%s"%(HERE, read("about.txt")))
    else:
        ds.append(config.about%(__version__,))
    ds.extend(back())
    ds.extend(front())
    write("\n\n".join(ds), "README.md")

if __name__ == "__main__":
    build()