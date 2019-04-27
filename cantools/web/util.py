import re, sys, ast, json, time, threading
from urllib import quote, unquote
from base64 import b64encode, b64decode
from cantools import config

DEBUG = True

# memcache stuff -- overwrite with setters
def getmem(key, tojson=True):
    log("memcache getting: %s"%(key,))

def setmem(key, val, fromjson=True):
    log("memcache setting: %s -> %s"%(key, val))

def delmem(key):
    log("memcache deleting: %s"%(key,))

def clearmem():
    log("memcache clearing")

def set_getmem(f):
    global getmem
    getmem = f

def set_setmem(f):
    global setmem
    setmem = f

def set_delmem(f):
    global delmem
    delmem = f

def set_clearmem(f):
    global clearmem
    clearmem = f

# logging -- overwrite with setlog if ya want
def log(*args, **kwargs):
    print args, kwargs

# encoding, decoding -- may overwrite with setenc/setdec, but not _that_ necessary
_c = config.scrambler
_cl = len(_c)
_chl = _cl / 2

def flip(c):
    i = _c.find(c)
    if i == -1:
        return c
    return _c[(i + _chl) % _cl]

def scramble(s):
    return "".join([flip(c) for c in s])

def enc(data):
    return scramble(b64encode(data))

def dec(data):
    return data.startswith("{") and data or b64decode(scramble(data))

# setters (see above)
def setlog(f):
    global log
    log = f

def setenc(f):
    global enc
    enc = f

def setdec(f):
    global dec
    dec = f

# threading
localvars = threading.local()
def local(key, fallback=None):
    return getattr(localvars, key, fallback)

# request functions
def deUnicodeDict(d):
    if not isinstance(d, dict):
        return d
    n = {}
    for v in d:
        n[str(v)] = deUnicodeDict(d[v])
    return n

def cgi_dump():
    return local("request_string")

def cgi_read():
    return local("read", sys.stdin.read)()

def set_read(f):
    localvars.read = f

def rdec(data):
    return unquote(b64decode(data)).decode('utf-8')

def renc(data):
    return b64encode(quote(data.encode('utf-8')))

def rb64(data, de=False): # depped
    log("[DEPRECATION WARNING] Something just called rb64(), which is depped -- use rec_conv()")
    return rec_conv(data, de)

def rec_conv(data, de=False):
    if isinstance(data, basestring):
        return (de and rdec or renc)(data)
    elif isinstance(data, dict):
        for k, v in data.items():
            data[str(k)] = rec_conv(v, de)
    elif isinstance(data, list):
        return [rec_conv(d, de) for d in data]
    return data

def qs_get(x, y):
    val = localvars.request.getvalue(x, y)
    if val:
        val = unquote(val)
    return val

def cgi_load(force=False):
    localvars.request_string = cgi_read()
    data = config.encode and dec(localvars.request_string) or localvars.request_string
    try:
        try:
            jdata = json.loads(data)
        except:
            jdata = ast.literal_eval(data)
        try:
            localvars.request = rec_conv(jdata, True)
        except:
            localvars.request = jdata
    except:
        import cgi
        localvars.request = cgi.FieldStorage()
        setattr(localvars.request, "get", qs_get)
    if not localvars.request:
        if force or config.web.server == "dez":
            localvars.request = {}
        else:
            fail('no request data!')

def cgi_get(key, choices=None, required=True, default=None):
    request = local("request")
    val = request.get(key, default)
    if val is None and required:
        fail('no value submitted for required field: "%s" [%s]'%(key, request))
    if choices and val not in choices:
        fail('invalid value for "%s": "%s"'%(key, val))
    return val

# response functions
def _send(data):
    send = local("send")
    if send:
        send(data)
    else:
        print data

def set_send(f):
    localvars.send = f

def _close():
    local("close", sys.exit)()

def set_close(f):
    localvars.close = f

def _pre_close():
    pass

def set_pre_close(f):
    global _pre_close
    _pre_close = f

def _header(hkey, hval):
    header = local("header")
    if header:
        header(hkey, hval)
    else:
        _send("%s: %s"%(hkey, hval))

def set_header(f):
    localvars.header = f

def _write(data, exit=True, savename=None):
    if savename:
        setmem(savename, data, False)
    try:
        data = data.decode('ascii', 'replace').encode('utf-8')
    except Exception, e:
        data = data.encode('utf-8')
    _send(data)
    if exit:
        _pre_close()
        _close()

def trysavedresponse(key=None):
    key = key or local("request_string")
    response = getmem(key, False)
    response and _write(response, exit=True)

def dez_wrap(resp, failure):
    from cantools.db import session
    from rel.errors import AbortBranch
    def f():
        try:
            resp()
        except AbortBranch, e:
            session.generator.remove()
            raise AbortBranch() # handled in rel
        except SystemExit:
            pass
        except Exception, e:
            failure(e)
    return f

def gae_wrap(resp, failure):
    def f():
        try:
            resp()
        except SystemExit:
            pass
        except Exception, e:
            failure(e)
    return f

resp_wrap = { "dez": dez_wrap, "gae": gae_wrap }

def do_respond(responseFunc, failMsg="failed", failHtml=False, failNoEnc=False, noLoad=False, threaded=False, response=None, autowin=True):
    def resp():
        response and response.set_cbs()
        noLoad or cgi_load()
        responseFunc()
        autowin and succeed()

    def failure(e):
        fail(data=failMsg, html=failHtml, err=e, noenc=failNoEnc)

    wrapped_response = resp_wrap[config.web.server](resp, failure)
    if threaded: # dez only!!!
        from rel import thread
        thread(wrapped_response)
    else:
        wrapped_response()

def redirect(addr, msg="", noscript=False, exit=True):
    a = "<script>"
    if msg:
        a += 'alert("%s"); '%(msg,)
    a += "document.location = '%s';</script>"%(addr,)
    if noscript:
        a += '<noscript>This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.</noscript>'
    _header("Content-Type", "text/html")
    _write(_env(True)%(a,), exit)

def setcachedefault(shouldCache=True):
    # deprecated -- should set via config.memcache.update("requst", [bool])
    config.memcache.update("request", shouldCache)

def _env(html):
    return "%s"

def set_env(f):
    global _env
    _env = f

def processResponse(data, code):
    if code == "1":
        try:
            data = json.dumps(data)
        except:
            data = json.dumps(rec_conv(data))
            code = "3"
    elif code == "0":
        try:
            json.dumps(data)
        except:
            data = rec_conv(data)
            code = "2"
    return "%s%s"%(code, data)

def succeed_sync(func, cb):
    d = {}
    def handle(*a, **k):
        d["a"] = a
        d["k"] = k
    func(handle)
    while True:
        time.sleep(0.01)
        if d["a"] or d["k"]:
            succeed(cb(*d["a"], **d["k"]))

def succeed(data="", html=False, noenc=False, savename=None, cache=False):
    if cache or config.memcache.request:
        savename = local("request_string")
    _header("Content-Type", "text/%s"%(html and "html" or "plain"))
    draw = processResponse(data, "1")
    dstring = (config.encode and not noenc) and enc(draw) or draw
    _write(_env(html)%(dstring,), savename=savename)

def fail(data="failed", html=False, err=None, noenc=False, exit=True):
    if err:
        # log it
        import traceback
        logdata = "%s --- %s --> %s"%(data, repr(err), traceback.format_exc())
        log(logdata, "error")
        if DEBUG:
            # write it
            data = logdata
    _header("Content-Type", "text/%s"%(html and "html" or "plain"))
    draw = processResponse(data, "0")
    dstring = (config.encode and not noenc) and enc(draw) or draw
    _write(_env(html)%(dstring,), exit)

def _headers(headers):
    for k, v in headers.items():
        _header(k, v)
    if config.web.server == "gae":
        _send("")

def send_pdf(data, title=None):
    if title:
        _headers({
            "Content-Type": 'application/pdf; name="%s.pdf"'%(title,),
            "Content-Disposition": 'attachment; filename="%s.pdf"'%(title,)
        })
    else:
        _headers({"Content-Type": "application/pdf"})
    _send(data)
    _close()

def send_image(data):
    _headers({"Content-Type": "image/png"})
    _send(data)
    _close()

FILETYPES = {"pdf": "application/pdf", "img": "image/png", "ico": "image/ico"}

def send_file(data, file_type=None, detect=False):
    if detect:
        import magic
        file_type = data and magic.from_buffer(data, True)
    if file_type:
        _headers({"Content-Type": FILETYPES.get(file_type, file_type)})
    _send(data)
    _close()

def send_text(data, dtype="html", fname=None, exit=True):
    headers = { "Content-Type": "text/%s"%(dtype,) }
    if fname:
        headers['Content-Disposition'] = 'attachment; filename="%s.%s"'%(fname, dtype)
    _headers(headers)
    _write(data, exit)

def send_xml(data):
    send_text(data, "xml")

# misc
def verify_recaptcha(cresponse, pkey):
    import os, urllib, urllib2
    verification_result = urllib2.urlopen(urllib2.Request(
        url = "https://www.google.com/recaptcha/api/siteverify",
        data = urllib.urlencode({
            'secret': pkey,
            'remoteip': os.environ.get('REMOTE_ADDR', os.environ.get('REMOTE_HOST')),
            'response': cresponse
            }),
        headers = {
            "Content-type": "application/x-www-form-urlencoded"
            }
        ))
    vdata = verification_result.read()
    verification_result.close()
    if "true" not in vdata:
        fail(vdata)

def strip_punctuation(s):
    return "".join([c for c in s if c.isalnum() or c.isspace()])

def strip_html(s):
    p = re.compile(r'<.*?>')
    return p.sub("", s)

def strip_html_old(s, keep_breaks=False):
    i = s.find('<');
    while i != -1:
        j = s.find('>', i)
        if keep_breaks and 'br' in s[i:j]:
            i = s.find('<', i+1)
        else:
            s = s[:i] + s[j+1:]
            i = s.find('<')
    s = s.replace("&nbsp;", " ")
    while "  " in s:
        s = s.replace("  ", " ")
    return s