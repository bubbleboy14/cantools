"""
### Usage: ctdeploy [-d|s|p] [-un] [--js_path=PATH]

### Options:

    -h, --help            show this help message and exit
    -d, --dynamic         switch to dynamic (development) mode
    -s, --static          switch to static (debug) mode
    -p, --production      switch to production (garbled) mode
    -u, --upload          uploads project in specified mode and then (if
                          gae) switches back to dynamic (development) mode
    -n, --no_build        skip compilation step
    -j JS_PATH, --js_path=JS_PATH
                          set javascript path (default=js)

### Supports 3 modes:
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

Generates fresh 'static' and 'production' files (from 'development' source files in 'html' on every run, unless -n [or --no_build] flag is used). Mode is established in the app.yaml file, which routes requests to the appropriate directory, and the ct.cfg file, which determines backend behavior, especially regarding encryption.
"""

import subprocess, os
from cantools import config, __version__
from cantools.util import log, error, read, write, cmd
from cantools.util.package import vpush
from .builder import build_all

try:
    input = raw_input # py2/3 compatibility
except NameError:
    pass

def doyaml(mode):
    log("switching to %s mode"%(mode,))
    lines = read(config.yaml.path, lines=True)
    f = open(config.yaml.path, 'w')
    m = None
    for line in lines:
        if line.startswith(config.yaml.start):
            m = line[len(config.yaml.start):].strip()
        elif line.startswith(config.yaml.end):
            m = None
        elif m == mode:
            line = line.strip("#")
        elif m:
            line = "#%s"%(line.strip("#"),)
        f.write(line)
    f.close()

def setmode(mode):
    doyaml(mode) # support other backends beyond app engine
    ctpy = read(config.py.path)
    isprod = mode == "production"
    # set encode
    ctpy = ctpy.replace(config.py.enc%(str(not isprod),),
        config.py.enc%(str(isprod),))
    # set mode
    for m in ["dynamic", "static", "production"]:
        if m != mode:
            ctpy = ctpy.replace(config.py.mode%(m,), config.py.mode%(mode,))
    write(ctpy, config.py.path)

def buildox():
    cmd("ctinit -a")
    cmd("ctdoc -w")
    os.chdir("docs")
    cmd("ctdeploy -p")
    os.chdir("..")

def upit():
    if config.web.server == "gae": # switches back to -d mode [ultra deprecated]
        log("uploading files")
        subprocess.call('appcfg.py update . --no_precompilation --noauth_local_webserver', shell=True)
        setmode("dynamic")
        return
    upop = input("upload with git or svn or cancel ([G]it/[s]vn/[c]ancel)? ").lower()[:1]
    if upop == "c":
        return
    if upop == "s":
        cmd('svn commit html-production/ -m"prod"')
    else: # default git
        cmd("git add html-production/")
        cmd('git commit -m "prod"')
        cmd("git push")

def run():
    from optparse import OptionParser
    parser = OptionParser("ctdeploy [-d|s|p] [-un] [--js_path=PATH]")
    parser.add_option("-d", "--dynamic", action="store_true", dest="dynamic",
        default=False, help="switch to dynamic (development) mode")
    parser.add_option("-s", "--static", action="store_true", dest="static",
        default=False, help="switch to static (debug) mode")
    parser.add_option("-p", "--production", action="store_true", dest="production",
        default=False, help="switch to production (garbled) mode")
    parser.add_option("-u", "--upload", action="store_true", dest="upload", default=False,
        help="uploads project in specified mode and then (if gae) switches back to dynamic (development) mode")
    parser.add_option("-n", "--no_build", action="store_true",
        dest="no_build", default=False, help="skip compilation step")
    parser.add_option("-j", "--js_path", dest="js_path", default=config.js.path,
        help="set javascript path (default=%s)"%(config.js.path,))
    parser.add_option("-v", "--vpush", action="store_true", dest="vpush",
        default=False, help="push a new version of cantools [ct dev only]")
    options, args = parser.parse_args()

    if options.vpush:
        vpush("cantools", "ct", __version__, buildox)
    else:
        mode = options.dynamic and "dynamic" or options.static and "static" or options.production and "production"
        if not mode:
            error("no mode specified")

        # 0) set js path
        if options.js_path != config.js.path:
            log("setting js path to: %s"%(options.js_path,))
            config.js.update("path", options.js_path)

        # 1) build static/production files
        if not options.no_build:
            build_all()

        # 2) switch to specified mode
        setmode(mode)

        # 3) if -u, upload project
        if options.upload:
            upit()

    log("goodbye")

if __name__ == "__main__":
    run()