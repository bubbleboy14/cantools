import subprocess, os
from cantools import config
from cantools.util import log, error, read, write, mkdir
try:
    from slimit import minify
except ImportError:
    pass # skipping slimit.minify() import for gae compatibility -- if you need it, install it!

def nextQuote(text, lastIndex=0):
    z = i = text.find('"', lastIndex)
    while z > 0 and text[z-1] == "\\":
        z -= 1
    return ((i-z)%2 == 0) and i or nextQuote(text, i+1)

def encodestrings(text):
    start = nextQuote(text) + 1
    while start != 0:
        end = nextQuote(text, start)
        if end == -1:
            error("parse",
                "unclosed quote: character %s"%(start-1,),
                "this quote: %s"%(text[start:start+config.parse_error_segment_length],),
                text)
        word = ''.join(["\\%s"%(oct(ord(ch))[1:],) for ch in list(text[start:end])])
        if "\\134" not in word: # don't re-escape!
            text = text[:start] + word + text[end:]
        start = nextQuote(text, start + len(word) + 1) + 1
    return text

def processhtml(html):
    html = html.replace("{", "&#123").replace("}", "&#125").replace("</body>", "%s</body>"%(config.noscript,))
    start = 0
    while not start or html[start + config.js.offset + 1] == "/":
        firststart = start = end = html.find(config.js.flag, start + 1)
    js = []
    while start != -1:
        start += config.js.offset
        end = html.find('"', start)
        if end == -1:
            error("no closing quote in this file: %s"%(html,))
        js.append(html[start:end].strip("/"))
        start = html.find(config.js.flag, end)
    log("js: %s"%(js,), 1)
    if start == end:
        return html, ""
    return html[:firststart] + "{jsspot}" + html[end+config.js.endoffset:], js

def compress(html):
    log("compressing html", 1)
    newhtml = html.replace("\n", " ").replace("\t", " ")
    while "  " in newhtml:
        newhtml = newhtml.replace("  ", " ")
    newhtml = newhtml.replace("> <", "><")
    log("orig: %s. new: %s"%(len(html), len(newhtml)), 2)
    return newhtml

def bfiles(dirname, fnames):
    return [fname for fname in fnames if os.path.isfile(os.path.join(dirname, fname)) and fname != ".svn" and not fname.endswith("~") and not "_old." in fname]

def tryinit(iline, inits, prefixes):
    if iline not in inits:
        inits.add(iline)
        prefixes.append(iline)

fragz = set()
def frag(path):
    if '"' in path:
        path = path.split('"')[0]
        for root, dirs, files in os.walk(path, followlinks=True):
            for sub in files:
                if sub.endswith(".js"):
                    fp = os.path.join(root, sub)
                    log("fragment identified: %s"%(fp,), 1)
                    fragz.add(fp)
    else:
        fragz.add(path)

def require(line, jspaths, block, inits, admin_ct_path=None):
    dynamic = False
    if line.startswith("CT.scriptImport("):
        rline = line[17:].split(line[16])[0]
        if rline.startswith("http"):
            return block
        dynamic = True
    else:
        rline = line.split('require(')[1][1:].split(");")[0].strip(")")
        if rline.endswith(", true"):
            dynamic = True
            rline = rline.split(", ")[0]
        rline = rline[:-1]
    rsplit = rline.split(".")
    log("module %s"%(rline,), important=True)
    jspath = os.path.join(config.js.path, *rsplit) + ".js"
    log("path %s"%(jspath,))
    log("dynamic %s"%(dynamic,))
    if jspath not in jspaths:
        if dynamic:
            frag(jspath)
        else:
            prefixes = []
            fullp = "window"
            for rword in rsplit:
                if rword[0].isalpha():
                    fullp = ".".join([fullp, rword])
                else:
                    fullp = "%s[%s]"%(fullp, rword)
                tryinit("%s = %s || {}"%(fullp, fullp), inits, prefixes)
            pblock = ";".join(prefixes)
            if pblock:
                jspaths.append(pblock)
            block = block.replace(line, "%s;%s"%(pblock,
                processjs(jspath, jspaths, inits, admin_ct_path)), 1)
    return block

def processjs(path, jspaths=[], inits=set(), admin_ct_path=None):
    p = path.split("#")[0] # potentially modded to locate file for prod (path remains the same for static)
    if admin_ct_path: # admin pages
        if path.startswith(config.js.path): # such as /js/CT/ct.js
            p = admin_ct_path + path[len(config.js.path):]
        else: # regular admin pages (/memcache/mc.js)
            p = os.path.join(os.path.abspath(os.curdir), "dynamic", path)
    block = read(p)
    for line in [bit for bit in block.split("\n") if not bit.startswith("//")]:
        for flag in ["CT.require(", "CT.scriptImport("]:
            if flag in line and line[line.index(flag) - 1] != "'":
                rline = line.strip().split(flag)[1]
                if rline[0] != "\\" and rline[1] not in ".,": # require() is embedded in text. dot is weird.
                    block = require("%s%s"%(flag, rline),
                        jspaths, block, inits, admin_ct_path)
    jspaths.append(path)
    return "%s;\n"%(block,)

def compilejs(js, admin_ct_path=None):
    jsblock = ""
    jspaths = []
    inits = set(["window.CT = window.CT || {}"]) # already initialized
    for p in js:
        jsblock += processjs(p, jspaths, inits, admin_ct_path)
    return jspaths, jsblock

def checkdir(p, recursive=False):
    if not os.path.isdir(p):
        mkdir(p, recursive)

def remerge(txt, js):
    return txt.format(jsspot=js).replace("&#123", "{").replace("&#125", "}")

def build_frags(mode="web", admin_ct_path=None):
    log("Compiling Dynamically-Referenced Fragments", important=True)
    base = config.build[mode].compiled.production
    if config.build.include:
        log("Including Config-Specified Modules")
        for p in config.build.include:
            log("include: %s"%(p,), 1)
            fragz.add(p)
    fcopy = set()
    def build_frag(frag):
        log("processing: %s"%(frag,), 1)
        block = processjs(frag, admin_ct_path=admin_ct_path)
        path = os.path.join(base, frag[len(config.js.path)+1:])
        checkdir(path.rsplit("/", 1)[0], True)
        if frag in config.build.exclude:
            log("path excluded -- skipping compression/obfuscation", 2)
        else:
            log("mangling", 2)
            block = minify(block, mangle=True)
        write(block, path)
    while len(fcopy) is not len(fragz):
        fcopy = fragz.difference(fcopy)
        map(build_frag, fcopy)

def build(admin_ct_path, dirname, fnames):
    """
    This parses an html file, squishes together the javascript, scans
    through for dynamic imports (CT.require statements), injects modules
    wherever necessary, and sticks the result in a big <script> tag.
    """
    conf = admin_ct_path and config.build.admin or config.build.web
    todir_stat = dirname.replace(conf.dynamic, conf.compiled.static)
    todir_prod = dirname.replace(conf.dynamic, conf.compiled.production)
    log("Target Static Directory: %s"%(todir_stat,), important=True)
    log("Target Production Directory: %s"%(todir_prod,))
    checkdir(todir_stat)
    checkdir(todir_prod)
    for fname in bfiles(dirname, fnames):
        frompath = os.path.join(dirname, fname)
        topath_stat = os.path.join(todir_stat, fname)
        topath_prod = os.path.join(todir_prod, fname)
        data = read(frompath)
        if "fonts" in dirname or not fname.endswith(".html"):
            log('copying non-html file (%s)'%(fname,), 1)
        else:
            txt, js = processhtml(data)
            if js:
                jspaths, jsblock = compilejs(js, admin_ct_path)
                log('writing static: %s -> %s'%(frompath, topath_stat), important=True)
                write(remerge(txt, '\n'.join([p.split("#")[0].endswith("js") and '<script src="/%s"></script>'%(p,) or '<script>%s</script>'%(p,) for p in jspaths])), topath_stat)
                log('writing production: %s -> %s'%(frompath, topath_prod))
                jsb = jsblock.replace('"_encode": false,', '"_encode": true,').replace("CT.log._silent = false;", "CT.log._silent = true;")
                if config.customscrambler:
                    jsb += '; CT.net.setScrambler("%s");'%(config.scrambler,)
                write(remerge(compress(txt), "<script>%s</script>"%(minify(jsb, mangle=True),)), topath_prod)
                continue
            else:
                log('copying to prod/stat unmodified (%s)'%(fname,), important=True)
        write(data, topath_stat)
        write(data, topath_prod)
    for fname in [f for f in fnames if os.path.isdir(os.path.join(dirname, f))]:
        os.path.walk(os.path.join(dirname, fname), build, admin_ct_path)

def silence_warnings():
    from ply import yacc, lex
    def quiet(*args, **kwargs):
        pass
    yacc.PlyLogger.warning = quiet
    lex.PlyLogger.warning = quiet

def build_all(mode="web", admin_ct_path=None):
    silence_warnings()
    os.path.walk(config.build[mode].dynamic, build, admin_ct_path)
    build_frags(mode, admin_ct_path)

if __name__ == "__main__":
    build_all()