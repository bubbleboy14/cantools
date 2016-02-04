import sys, json
from base64 import b64encode, b64decode
from cantools import config

DEBUG = True
request = None
request_string = None
cache_default = False

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

# logging, encoding, decoding -- overwrite with setlog, setenc, setdec
def log(*args, **kwargs):
    print args, kwargs

def enc(data):
    return data

def dec(data):
    return data

def setlog(f):
    global log
    log = f

def setenc(f):
    global enc
    enc = f

def setdec(f):
    global dec
    dec = f

# request functions
def deUnicodeDict(d):
    if not isinstance(d, dict):
        return d
    n = {}
    for v in d:
        n[str(v)] = deUnicodeDict(d[v])
    return n

def cgi_dump():
    return request_string

def cgi_read():
    return sys.stdin.read()

def set_read(f):
    global cgi_read
    cgi_read = f

def rb64(data, de=False):
    if isinstance(data, basestring):
        return (de and b64decode or b64encode)(data)
    elif isinstance(data, dict):
        for k, v in data.items():
            data[str(k)] = rb64(v, de)
    elif isinstance(data, list):
        return [rb64(d, de) for d in data]
    return data

def cgi_load(force=False):
    global request
    global request_string
    request_string = cgi_read()
    data = config.encode and dec(request_string) or request_string
    try:
        request = rb64(json.loads(data), True)
    except:
        import cgi
        request = cgi.FieldStorage()
        setattr(request, "get", lambda x, y: request.getvalue(x, y))
    if not request:
        if force or config.web_server == "dez":
            request = {}
        else:
            fail('no request data!')

def cgi_get(key, choices=None, required=True, default=None):
    val = request.get(key, default)
    if val is None and required:
        fail('no value submitted for required field: "%s" [%s]'%(key, request))
    if choices and val not in choices:
        fail('invalid value for "%s": "%s"'%(key, val))
    return val

# response functions
def _send(data):
    print data

def set_send(f):
    global _send
    _send = f

def _close():
    sys.exit()

def set_close(f):
    global _close
    _close = f

def _pre_close():
    pass

def set_pre_close(f):
    global _pre_close
    _pre_close = f

def _header(hkey, hval):
    _send("%s: %s"%(hkey, hval))

def set_header(f):
    global _header
    _header = f

def _write(data, exit=True, savename=None):
    if savename:
        setmem(savename, data, False)
    _send(data.encode('utf-8'))
    if exit:
        _pre_close()
        _close()

def trysavedresponse(key=None):
    key = key or request_string
    response = getmem(key, False)
    response and _write(response, exit=True)

def _respond(responseFunc, failMsg="failed", failHtml=False, failNoEnc=False):
    def f():
        try:
            responseFunc()
            succeed()
        except Exception, e:
            fail(data=failMsg, html=failHtml, err=e, noenc=failNoEnc, exit=False)
        except SystemExit:
            pass
    return f

def do_respond(responseFunc, failMsg="failed", failHtml=False, failNoEnc=False, noLoad=False, threaded=False):
    noLoad or cgi_load()
    resp = _respond(responseFunc, failMsg=failMsg, failHtml=failHtml, failNoEnc=failNoEnc)
    if threaded:
        from thread import start_new_thread
        start_new_thread(resp, ())
    else:
        resp()

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
    global cache_default
    cache_default = shouldCache

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
            data = json.dumps(rb64(data))
            code = "3"
    elif code == "0":
        try:
            json.dumps(data)
        except:
            data = rb64(data)
            code = "2"
    return "%s%s"%(code, data)

def succeed(data="", html=False, noenc=False, savename=None, cache=False):
    if cache or cache_default:
        savename = request_string
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
    if config.web_server == "gae":
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

FILETYPES = {"pdf": "application/pdf", "img": "image/png"}

def send_file(data, file_type):
    _headers({"Content-Type": FILETYPES[file_type]})
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
def verify_recaptcha(cchallenge, cresponse, pkey):
    import os, urllib, urllib2
    verification_result = urllib2.urlopen(urllib2.Request(
        url = "http://api-verify.recaptcha.net/verify",
        data = urllib.urlencode({
            'privatekey': pkey,
            'remoteip': os.environ.get('REMOTE_ADDR', os.environ.get('REMOTE_HOST')),
            'challenge': cchallenge,
            'response': cresponse
            }),
        headers = {
            "Content-type": "application/x-www-form-urlencoded"
            }
        ))
    vdata = verification_result.read().splitlines()
    verification_result.close()
    if vdata[0] != "true":
        fail(vdata[1])

def strip_punctuation(s):
    return "".join([c for c in s if c.isalnum() or c.isspace()])

def strip_html(s, keep_breaks=False):
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