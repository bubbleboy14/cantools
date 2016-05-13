import subprocess, os
from cantools import config
from cantools.util import log, error, read, write

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
    firststart = start = end = html.find(config.js.flag)
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

def require(line, jspaths, block, inits):
    rline = line[12:-3]
    rsplit = rline.split(".")
    jspath = os.path.join(config.js.path, *rsplit) + ".js"
    if jspath not in jspaths:
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
            processjs(jspath, jspaths, inits)), 1)
    return block

def processjs(path, jspaths, inits):
    block = read(path)
    for line in block.split("\n"):
        if line.startswith("CT.require(") and not line.endswith(", true);"):
            block = require(line, jspaths, block, inits)
    jspaths.append(path)
    return "%s;\n"%(block,)

def compilejs(js):
    jsblock = ""
    jspaths = []
    inits = set(["window.CT = window.CT || {}"]) # already initialized
    for p in js:
        jsblock += processjs(p, jspaths, inits)
    return jspaths, jsblock

def checkdir(p):
    if not os.path.isdir(p):
        log('making directory "%s"'%(p,), 1)
        os.mkdir(p)

def build(nothing, dirname, fnames):
    """
    This parses an html file, squishes together the javascript, scans
    through for dynamic imports (CT.require statements), injects modules
    wherever necessary, and sticks the result in a big <script> tag.
    """
    if ".svn" in dirname:
        return
    for bd in config.build.compiled_dirs.values():
        checkdir(bd)
    for fname in bfiles(dirname, fnames):
        for mode, compdir in config.build.compiled_dirs.items():
            fulldir = dirname.replace(config.build.dynamic_dir, compdir)
            frompath = os.path.join(dirname, fname)
            topath = os.path.join(fulldir, fname)
            data = read(frompath)
            log('building: %s -> %s'%(frompath, topath), important=True)
            checkdir(fulldir)
            if "fonts" in dirname or not fname.endswith(".html"):
                log('copying non-html file', 1)
            else:
                txt, js = processhtml(data)
                if js:
                    jspaths, jsblock = compilejs(js)
                    if mode is "static":
                        log("static mode", 1)
                        js = '\n'.join([p.endswith("js") and '<script src="%s"></script>'%(p,) or '<script>%s</script>'%(p,) for p in jspaths])
                    elif mode is "production":
                        log("production mode", 1)
                        txt = compress(txt)
                        from slimit import minify
                        js = "<script>%s</script>"%(minify(jsblock.replace('"_encode": false,', '"_encode": true,').replace("CT.log._silent = false;", "CT.log._silent = true;"), mangle=True),)
                    else:
                        error("invalid mode: %s"%(mode,))
                    data = txt.format(jsspot=js)
                else:
                    data = txt
            write(data, topath)

if __name__ == "__main__":
    os.path.walk(config.build.dynamic_dir, build, "html")
