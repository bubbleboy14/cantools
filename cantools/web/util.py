import sys, json

DEBUG = True
envelope = {
    'plain': "Content-Type: text/plain\n\n%s",
    'html': "Content-Type: text/html\n\n<html><head></head><body>%s</body></html>" }
request = None
request_string = None
cache_default = False

# logging and encoding -- overwrite with setlog and setenc
def log(*args, **kwargs):
    print args, kwargs

def enc(data, noenc=False, etype="response"):
    return data

def setlog(f):
    global log
    log = f

def setenc(f):
    global enc
    enc = f

# request functions
def deUnicodeDict(d):
    if d.__class__.__name__ != "dict":
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

def cgi_load(force=False):
    global request
    global request_string
    request_string = cgi_read()
    data = enc(request_string, False, "request")
    try:
        request = deUnicodeDict(json.loads(data))
    except:
        import cgi
        request = cgi.FieldStorage()
        setattr(request, "get", lambda x, y: request.getvalue(x, y))
    if not request:
        if force:
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

def _write(data, exit=True, savename=None):
    if savename:
        setmem(savename, data, False)
    _send(data.encode('utf-8').strip())
    exit and _close()

def trysavedresponse(key=None):
    key = key or request_string
    response = getmem(key, False)
    response and _write(response, exit=True)

def do_respond(responseFunc, failMsg="failed", failHtml=False, failNoEnc=False, noLoad=False):
    try:
        noLoad or cgi_load()
        responseFunc()
        succeed()
    except Exception, e:
        fail(data=failMsg, html=failHtml, err=e, noenc=failNoEnc, exit=False)
    except SystemExit:
        pass

def redirect(addr, msg="", noscript=False, exit=True):
    a = "<script>"
    if msg:
        a += 'alert("%s"); '%(msg,)
    a += "document.location = '%s';</script>"%(addr,)
    if noscript:
        a += '<noscript>This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.</noscript>'
    _write(envelope['html']%(a,), exit)

def setcachedefault(shouldCache=True):
    global cache_default
    cache_default = shouldCache

def succeed(data="", html=False, noenc=False, savename=None, cache=False):
    if cache or cache_default:
        savename = request_string
    s = html and envelope['html'] or envelope['plain']
    _write(s%(enc("1"+json.dumps(data), noenc),), savename=savename)

def fail(data="failed", html=False, err=None, noenc=False, exit=True):
    s = html and envelope['html'] or envelope['plain']
    if err:
        # log it
        import traceback
        logdata = "%s --- %s --> %s"%(data, repr(err), traceback.format_exc())
        log(logdata, "error")
        if DEBUG:
            # write it
            data = logdata
    _write(s%(enc("0"+data, noenc),), exit)

def send_pdf(data, title=None):
    if title:
        _send('Content-Type: application/pdf; name="%s.pdf"'%(title,))
        _send('Content-Disposition: attachment; filename="%s.pdf"'%(title,))
    else:
        _send("Content-Type: application/pdf")
    _send("")
    _send(data)
    sys.exit()

def send_image(data):
    _send("Content-Type: image/png")
    _send("")
    _send(data)
    sys.exit()

FILETYPES = {"pdf": "application/pdf", "img": "image/png"}

def send_file(data, file_type):
    _send("Content-Type: " + FILETYPES[file_type])
    _send("")
    _send(data)
    sys.exit()

def send_text(data, dtype="html", fname=None, exit=True):
    msg = ["Content-Type: text/%s"%(dtype,)]
    if fname:
        msg.append('Content-Disposition: attachment; filename="%s.%s"'%(fname, dtype))
    msg.append("")
    msg.append(data)
    _write('\n'.join(msg), exit)

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