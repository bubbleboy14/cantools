import subprocess, os
from config import PARSE_ERROR_SEGMENT_LENGTH, DYNAMIC_DIR, BUILD_DIRS, CTPATH, JSFLAG, JSOFFSET, JSENDOFFSET, NOSCRIPT
from util import log, error, read, write
try:
    from slimit import minify
except ImportError:
    error("missing dependency! type: 'sudo easy_install slimit'")

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
                "this quote: %s"%(text[start:start+PARSE_ERROR_SEGMENT_LENGTH],),
                text)
        word = ''.join(["\\%s"%(oct(ord(ch))[1:],) for ch in list(text[start:end])])
        if "\\134" not in word: # don't re-escape!
            text = text[:start] + word + text[end:]
        start = nextQuote(text, start + len(word) + 1) + 1
    return text

def processhtml(html):
    html = html.replace("{", "&#123").replace("}", "&#125").replace("</body>", "%s</body>"%(NOSCRIPT,))
    firststart = start = end = html.find(JSFLAG)
    js = []
    while start != -1:
        start += JSOFFSET
        end = html.find('"', start)
        if end == -1:
            error("no closing quote in this file: %s"%(html,))
        js.append(html[start:end])
        start = html.find(JSFLAG, end)
    log("- js: %s"%(js,))
    if start == end:
        return html, ""
    return html[:firststart] + "{jsspot}" + html[end+JSENDOFFSET:], js

def compress(html):
    log("compressing html")
    newhtml = html.replace("\n", " ").replace("\t", " ")
    while "  " in newhtml:
        newhtml = newhtml.replace("  ", " ")
    newhtml = newhtml.replace("> <", "><")
    log(" - orig: %s. new: %s"%(len(html), len(newhtml)))
    return newhtml

def bfiles(dirname, fnames):
    return [fname for fname in fnames if os.path.isfile(os.path.join(dirname, fname)) and fname != ".svn" and not fname.endswith("~") and not "_old." in fname]

def processjs(path, jspaths, ctpath=False):
    block = read("%s%s"%(ctpath and CTPATH or "..", path))
    for line in block.split("\n"):
        if line.startswith("CT.require(") and not line.endswith(", true);"):
            jspath = "/%s.js"%(line[12:-3].replace(".", "/"),)
            if jspath not in jspaths:
                block = block.replace(line, processjs(jspath, jspaths, True))
    jspaths.append(path)
    return "%s;\n"%(block,)

def compilejs(js):
    jsblock = ""
    jspaths = []
    for p in js:
        jsblock += processjs(p, jspaths)
    return jspaths, jsblock

def checkdir(p):
    if not os.path.isdir(p):
        log('making directory "%s"'%(p,))
        os.mkdir(p)

def build(nothing, dirname, fnames):
    """
    This parses an html file, squishes together the javascript, scans
    through for dynamic imports (CT.require statements), injects modules
    wherever necessary, and sticks the result in a big <script> tag.
    """
    if ".svn" in dirname:
        return
    for bd in BUILD_DIRS.values():
        checkdir(bd)
    for fname in bfiles(dirname, fnames):
        for mode, compdir in BUILD_DIRS.items():
            fulldir = dirname.replace(DYNAMIC_DIR, compdir)
            frompath = os.path.join(dirname, fname)
            topath = os.path.join(fulldir, fname)
            data = read(frompath)
            checkdir(fulldir)
            log('building: %s -> %s'%(frompath, topath))
            if "fonts" in dirname or not fname.endswith(".html"):
                log('- copying non-html file')
            else:
                txt, js = processhtml(data)
                if js:
                    jspaths, jsblock = compilejs(js)
                    if mode is "static":
                        log("- static mode")
                        js = '\n'.join(['<script src="%s"></script>'%(p,) for p in jspaths])
                    elif mode is "production":
                        log("- production mode")
                        txt = compress(txt)
                        js = "<script>%s</script>"%(minify(jsblock.replace('"_encode": false,', '"_encode": true,'), mangle=True),)
                    else:
                        error("invalid mode: %s"%(mode,))
                    data = txt.format(jsspot=js)
                else:
                    data = txt
            write(data, topath)

if __name__ == "__main__":
    os.path.walk(DYNAMIC_DIR, build, "html")
