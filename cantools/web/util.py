import re, os, sys, ast, json, time
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from dez.http.static import StaticStore
from babyweb.util import local, send_file
from babyweb.config import config as tinyfyg
from cantools import config

# request functions
def deUnicodeDict(d):
    if not isinstance(d, dict):
        return d
    n = {}
    for v in d:
        n[str(v)] = deUnicodeDict(d[v])
    return n

def setcachedefault(shouldCache=True):
    config.memcache.update("request", shouldCache)
    tinyfyg.update("memcache", shouldCache)

# misc
def verify_recaptcha(cresponse, pkey):
    verification_result = urlopen(Request(
        url = "https://www.google.com/recaptcha/api/siteverify",
        data = urlencode({
            'secret': pkey,
            'remoteip': os.environ.get('REMOTE_ADDR', os.environ.get('REMOTE_HOST')),
            'response': cresponse
        }).encode(),
        headers = {
            "Content-type": "application/x-www-form-urlencoded"
        }))
    vdata = verification_result.read().decode()
    verification_result.close()
    if "true" not in vdata:
        fail(vdata)

def strip_punctuation(s):
    return "".join([c for c in s if c.isalnum() or c.isspace()])

def strip_html(s):
    p = re.compile(r'<.*?>')
    return p.sub("", s)

def strip_html_carefully(s, besides=[]):
    i = s.find('<');
    while i != -1:
        j = s.find('>', i)
        if s[i+1:j] in besides or s[i+2:j] in besides:
            i = s.find('<', i+1)
        else:
            s = s[:i] + s[j+1:]
            i = s.find('<')
    s = s.replace("&nbsp;", " ")
    while "  " in s:
        s = s.replace("  ", " ")
    return s

# media extraction
ITYPES = [ # from CT.parse.imgTypes[]
    ".png", ".PNG",
    ".jpg", ".JPG",
    ".gif", ".GIF",
    ".img", ".IMG",
    ".bmp", ".BMP",
    "jpeg", "JPEG",
    "webp", "WEBP",
    "avif", "AVIF"
]

def vid2thumb(url):
    if "youtube.com" in url and "img.youtube.com" not in url:
        if "shorts" in url:
            token = url.split("/").pop()
        else:
            token = url.split("?v=")[1]
        url = "https://img.youtube.com/vi/%s/0.jpg"%(token,)
    elif "tl.fzn.party" in url:
        url = url.replace("/v/", "/img/v/").replace(".mp4", ".jpg")
    if url[-4:] in ITYPES: # fast
        return url
    for itype in ITYPES: # thorough
        if itype in url:
            return url

def text2image(parts, full=False):
    name = []
    while parts:
        part = parts.pop(0)
        if part.startswith("https://"):
            part = vid2thumb(part)
            if not part:
                continue
            if part[-4:] in ITYPES: # fast
                break
            for itype in ITYPES: # thorough
                if itype in part:
                    break
        name.append(part)
    if full:
        return " ".join(name), part, " ".join(parts)
    return part

def text2parts(text):
    if " http" in text:
        name, rest = text.split(" http", 1)
        if " " in rest:
            image, blurb = rest.split(" ", 1)
            image = vid2thumb("http%s"%(image,))
            if name and image and blurb:
                return name, image, blurb
    return text2image(text.split(" "), True)

# metaization
metastore = StaticStore()
qcache = {}
METS = """
  <meta property="og:title" content="%s">
  <meta property="twitter:title" content="%s">
  <meta property="og:image" content="%s">
  <meta property="twitter:image" content="%s">
  <meta property="og:description" content="%s">
  <meta property="twitter:description" content="%s">
  <meta property="description" content="%s">
"""

def metized(m, markup=None):
    n = m["name"]
    i = m["image"]
    b = m["blurb"]
    mets = METS%(n, n, i, i, b, b, b)
    return markup and markup.replace("<head>",
        "<head>%s"%(mets,)) or mets

def metize(mextractor):
    qs = local("request_string") # better key?
    p = local("response").request.url
    mdir = config.mode == "dynamic" and "html" or "html-%s"%(config.mode,)
    fp = "%s%s"%(mdir, p)
    if os.path.isdir(fp):
        fp += "/index.html"
    if p not in qcache:
        qcache[p] = {}
    if qs not in qcache[p]:
        markup = metastore.read(fp)[0].decode()
        metas = mextractor(p, markup)
        qcache[p][qs] = metas and metized(metas, markup) or markup
    send_file(qcache[p][qs])
