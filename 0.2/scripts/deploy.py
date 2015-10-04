"""
OLD WAY: compile javascript; change app.yaml; upload; change app.yaml back.

NEW WAY:
Supports 3 modes:
 - dynamic (files live in html)
   - normal development files
     - dynamic imports throughout
   - original files are loaded ad-hoc
     - chrome debugger plays nice
   - no wire encryption
   - all imports lazy
 - static (files live in html-static)
   - compiler builds same html files
     - script imports in head
     - otherwise unmodified source files
   - original files are directly referenced
     - chrome debugger prefers
   - no wire encryption
   - all hard requirements loaded in head
     - lazy-designated imports still lazy
 - production (files live in html-production)
   - all code is compiled in head
     - html is compressed
     - javascript is minified and mangled
   - original code is unrecognizable
     - chrome debugger almost useless
   - wire encryption
   - designated lazy imports (indicated by second bool arg to CT.require)

Generates fresh 'static' and 'production' files (from 'development' source files in 'html' on every run, regardless of flags). Mode is established in the yaml file, which routes requests to the appropriate directory. Will have modular platform backends -- currently supports app engine.
"""

import subprocess, commands, os
from config import YPATH, YSTART, YEND, CT_PY_PATH, ENC_TOGGLE, MODE_SWAP
from util import log, error, read, write
from builder import build

def doyaml(mode):
    log("switching to %s mode"%(mode,))
    lines = read(YPATH, lines=True)
    f = open(YPATH, 'w')
    m = None
    for line in lines:
        if line.startswith(YSTART):
            m = line[len(YSTART):].strip()
        elif line.startswith(YEND):
            m = None
        elif m == mode:
            line = line.strip("#")
        elif m:
            line = "#%s"%(line.strip("#"),)
        f.write(line)
    f.close()

def setmode(mode):
    doyaml(mode) # support other backends beyond app engine
    ctpy = read(CT_PY_PATH)
    isprod = mode == "production"
    # set encode
    ctpy = ctpy.replace(ENC_TOGGLE%(str(not isprod),),
        ENC_TOGGLE%(str(isprod),))
    # set mode
    for m in ["dynamic", "static", "production"]:
        if m != mode:
            ctpy = ctpy.replace(MODE_SWAP%(m,), MODE_SWAP%(mode,))
    write(ctpy, CT_PY_PATH)

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser("python deploy.py [-d|s|p] [-u]")
    parser.add_option("-d", "--dynamic", action="store_true", dest="dynamic",
        default=False, help="switch to dynamic (development) mode")
    parser.add_option("-s", "--static", action="store_true", dest="static",
        default=False, help="switch to static (debug) mode")
    parser.add_option("-p", "--production", action="store_true", dest="production",
        default=False, help="switch to production (garbled) mode")
    parser.add_option("-u", "--upload", action="store_true", dest="upload",
        default=False, help="uploads project in specified mode and then switches back to dynamic (development) mode")
    parser.add_option("-n", "--no_build", action="store_true",
        dest="no_build", default=False, help="skip compilation step")
    options, args = parser.parse_args()

    mode = options.dynamic and "dynamic" or options.static and "static" or options.production and "production"
    if not mode:
        error("no mode specified")

    # 1) build static/production files
    if not options.no_build:
        os.path.walk("../html", build, None)

    # 2) switch to specified mode
    setmode(mode)

    # 3) if -u, upload project and switch back to -d mode
    if options.upload:
        log("uploading files")
        subprocess.call('appcfg.py update .. --no_precompilation', shell=True)
        setmode("dynamic")

    log("goodbye")