import os, sys
from cantools.util import cmd, log, py

def managedpip():
    fname = "/usr/lib/python%s/EXTERNALLY-MANAGED"%(".".join(sys.version.split(" ").pop(0).split(".")[:2]),)
    print("checking for", fname)
    isext = os.path.isfile(fname)
    print("found:", isext)
    return isext

def pipper(execute=False, force=False):
    p = "pip3 install -e ."
    valid = True
    if managedpip():
        log("your Python is externally managed by your OS")
        if force or input("install anyway? [y/N] ").lower().startswith("y"):
            p += " --break-system-packages --use-pep517"
        else:
            valid = False
    if execute:
        if valid:
            cmd(p, True)
        else:
            log("aborting execution!")
    else:
        log(p)
    return p

def pushv(version):
    cmd("git add -u")
    cmd('git commit -m "vpush %s"'%(version,))
    cmd("git push")

def upv(oldver, newver, pname):
    fnames = [
        "setup.py",
        "about.txt",
        os.path.join(pname, "__init__.py"),
        os.path.join(pname, "version.py"),
    ]
    for fname in fnames:
        if os.path.exists(fname):
            log("updating: %s"%(fname,), 1)
            write(read(fname).replace(oldver, newver), fname)

def incv(curver):
    log("current version: %s"%(curver,))
    vnumz = [int(n) for n in curver.split(".")]
    while len(vnumz) < 4:
        vnumz.append(0)
    vnumz[-1] += 1
    minor = ".".join([str(n) for n in vnumz])
    vnumz[-2] += 1
    major = ".".join([str(n) for n in vnumz[:-1]])
    log("How should we increment? You have three options:", important=True)
    log("Major ('M' - %s)"%(major,), 1)
    log("Minor ('m' - %s)"%(minor,), 1)
    log("Custom ('c')", 1)
    selection = input("So? (M/m/c - default: m): ")
    if selection == "c":
        version = input("ok, then. what's the new version #? ")
    elif selection == "M":
        version = major
    else: # default (minor)
        version = minor
    log("going with: %s"%(version,), important=True)
    return version

def pwheel(pname, version, withCheese=False):
    log("laying egg (universal py2/3 wheel)", important=True)
    py("setup.py bdist_wheel --universal", True)
    if withCheese or input("push to cheese shop? [N/y] ").lower().startswith("y"):
        log("pushing to cheese shop", important=True)
        cmd("twine upload dist/%s-%s-py2.py3-none-any.whl"%(pname, version))

def refresh_plugins():
    pcmd = pipper()
    def refresher():
        cmd("git pull")
        cmd(pcmd, True)
    from cantools.util.admin import plugdirs
    plugdirs(refresher, input("search directory? [default: .ctplug] ") or ".ctplug",
        input("filter by preface? [suggested: ct] "))