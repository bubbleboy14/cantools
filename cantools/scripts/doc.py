"""
### Usage: ctdoc [-w]

### Options:
    -h, --help  show this help message and exit
    -w, --web   build web docs

Run from cantools root (contains setup.py, cantools/, README.md, etc), from root
of a CT plugin, or from within a custom project. In cantools, builds docs for all
frontend (js) and CLI (py) files. In plugin, docs consist of about file (about.txt),
initialization config (init.py) and default frontend config (js/config.js). In custom
(project) mode (when ctdoc is run somewhere other than cantools root or a plugin root,
and additionally a configuration file, doc.cfg, is present), for each path declared in
doc.cfg, include the docstring of each file specified, as well as the contents of
about.txt (if present). (TODO: application mode, which doesn't require configuration
[doc.cfg] -- instead, it recurses through the directories of your project, continuing
to drill as long as the current directory contains an about.txt, and includes these
[about.txt files], as well as [the top of] any py/js file that starts with a docstring).
"""

import os, json
from optparse import OptionParser
from cantools import __version__, config
from cantools.util import read, write, log, cp, cmd

HERE = os.path.abspath(".").split(os.path.sep)[-1]
CUSTOM = HERE != "cantools" and os.path.isfile("doc.cfg") and read("doc.cfg")
ISPLUGIN = HERE != "cantools" and not CUSTOM and HERE
WEB = []
ALTS = {
    "pubsub": os.path.join("pubsub", "__init__")
}
if not CUSTOM:
    if ISPLUGIN:
        JSPATH = os.path.join(HERE, "js")
        BPATH = "."
        ALTS["init"] = os.path.join(ISPLUGIN, "init")
    else:
        JSPATH = os.path.join(HERE, "CT")
        BPATH = os.path.join(HERE, "scripts")

def space(data):
    return "    " + data.replace("\n", "\n    ")

def dsBack(cmd):
    cpath = os.path.join(BPATH, "%s.py"%(ALTS.get(cmd, cmd),))
    log(cpath, 2)
    bdata = read(cpath)
    fdata = ISPLUGIN and space(bdata) or "## ct%s\n%s"%(cmd, bdata[4:].split('\n"""')[0])
    WEB[-1]["children"].append({
        "name": cmd,
        "content": fdata
    })
    return fdata

def dsFront(mod, modname=None, iline=None):
    modname = modname or "CT.%s"%(mod[:-3],)
    iline = iline or (mod == "ct.js" and '&lt;script src="/js/CT/ct.js"&gt;&lt;/script&gt;' or 'CT.require("%s");'%(modname,))
    log(modname, 2)
    mdata = read(os.path.join(JSPATH, mod))
    rdata = "\n".join([
        "## %s"%(modname,),
        "### Import line: '%s'"%(iline,),
        (ISPLUGIN and mod == "config.js") and space(mdata) or mdata[3:].split("\n*/")[0]
    ])
    WEB[-1]["children"].append({
        "name": mod,
        "content": rdata
    })
    return rdata

def back():
    log("back", 1)
    wobj = { "children": [] }
    WEB.append(wobj)
    f = []
    if ISPLUGIN:
        wobj["name"] = "Back (Init Config)"
        fdata = [dsBack("init")]
    else:
        wobj["name"] = "Back (CLI)"
        fdata = map(dsBack, ["init", "start", "deploy", "pubsub", "migrate", "index", "doc"])
    f.append("# %s"%(wobj["name"],))
    f += fdata
    return f

def front():
    log("front", 1)
    wobj = { "children": [] }
    WEB.append(wobj)
    f = []
    if not ISPLUGIN:
        wobj["name"] = "Front (JS Library)"
        plist = os.listdir(JSPATH)
        plist.sort()
        fdata = map(dsFront, filter(lambda i : i.endswith("js"), plist))
    elif os.path.isfile(os.path.join(JSPATH, "config.js")):
        wobj["name"] = "Front (JS Config)"
        fdata = [dsFront("config.js", "core.config.%s"%(ISPLUGIN,), 'CT.require("core.config");')]
    if "name" in wobj:
        f.append("# %s"%(wobj["name"],))
        f += fdata
    return f

def customChunk(path, fnames):
    log("custom chunk: %s"%(path,), 1)
    kids = []
    wobj = { "name": path, "children": kids }
    WEB.append(wobj)
    f = ["## %s"%(path,)]
    afile = os.path.join(path, "about.txt")
    if os.path.isfile(afile):
        adata = read(afile)
        f.append(adata)
        kids.append({
            "name": "about",
            "content": adata
        })
    for fname in fnames:
        fdata = read(os.path.join(path, fname))
        if fname == "config.js" or fname.startswith("ct.cfg"): # for non-local backend cfgs
            fdata = space(fdata)
        elif fname.endswith(".js"):
            fdata = fdata[3:].split("\n*/")[0]
        elif fname.endswith(".py"):
            fdata = fdata[4:].split('\n"""')[0]
        f.append("### %s\n%s"%(fname, fdata))
        kids.append({
            "name": fname,
            "content": fdata
        })
    return f

def build():
    parser = OptionParser("ctdoc [-w]")
    parser.add_option("-w", "--web", action="store_true",
        dest="web", default=False, help="build web docs")
    options, args = parser.parse_args()
    log("building docs")
    ds = []
    abdata = (ISPLUGIN or CUSTOM) and "# %s\n%s"%(HERE, read("about.txt")) or config.about%(__version__,)
    ds.append(abdata)
    WEB.append({
        "name": HERE,
        "children": [{
            "name": "about",
            "content": abdata
        }]
    })
    if CUSTOM:
        for line in CUSTOM.split("\n"):
            path, fnames = line.split(" = ")
            ds.extend(customChunk(path, fnames.split("|")))
    else:
        ds.extend(back())
        ds.extend(front())
    log("writing data", important=True)
    log("README.md", 1)
    write("\n\n".join(ds), "README.md")
    if options.web:
        log("web docs enabled!", 1)
        log("building docs web application", 2)
        if not os.path.isdir("docs"):
            cmd("ctinit docs -p ctdocs")
        log("copying data", 2)
        cp("core.data = %s;"%(json.dumps(WEB, indent=4),), os.path.join("docs", "js", "core", "data.js"))
    log("goodbye")

if __name__ == "__main__":
    build()