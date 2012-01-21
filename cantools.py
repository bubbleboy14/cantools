"""
cantools.py
version 0.1.5
MIT License:

Copyright (c) 2011 Civil Action Network

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

import sys
from django.utils import simplejson

DEBUG = True
envelope = {
    'plain': "Content-Type: text/plain\n\n%s",
    'html': "Content-Type: text/html\n\n<html><head></head><body>%s</body></html>" }

# logging and encoding -- overwrite with setlog and setenc
def log(message, type="info"):
    pass

def enc(data, noenc=False, etype="response"):
    return data

def setlog(f):
    global log
    log = f

def setenc(f):
    global enc
    enc = f

# response functions
def _write(data):
    print data
    sys.exit()

def redirect(addr, msg="", noscript=False):
    a = "<script>"
    if msg:
        a += 'alert("%s"); '%(msg,)
    a += "document.location = '%s';</script>"%(addr,)
    if noscript:
        a += '<noscript>This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.</noscript>'
    _write(envelope['html']%(a,))

def succeed(data="", html=False, noenc=False):
    s = html and envelope['html'] or envelope['plain']
    _write(s%(enc("1"+simplejson.dumps(data), noenc),))

def fail(data="failed", html=False, err=None):
    s = html and envelope['html'] or envelope['plain']
    if err:
        # log it
        import traceback
        logdata = "%s --- %s --> %s"%(data, repr(err), traceback.format_exc(2))
        log(logdata, "error")
        if DEBUG:
            # write it
            data = logdata
    _write(s%(enc("0"+data),))

def send_pdf(data, title):
    print 'Content-Type: application/pdf; name="%s.pdf"'%(title,)
    print 'Content-Disposition: attachment; filename="%s.pdf"'%(title,)
    print ""
    print data
    sys.exit()

def send_image(data):
    print "Content-Type: image/png"
    print ""
    print data
    sys.exit()

def send_text(data, dtype="html", fname=None):
    print "Content-Type: text/%s"%(dtype,)
    if fname:
        print 'Content-Disposition: attachment; filename="%s.%s"'%(fname, dtype)
    print ""
    print data
    sys.exit()    

def send_xml(data):
    send_text(data, "xml")

# request functions
request = None

def deUnicodeDict(d):
    if d.__class__.__name__ != "dict":
        return d
    n = {}
    for v in d:
        n[str(v)] = deUnicodeDict(d[v])
    return n

def cgi_load(force=False):
    global request
    data = enc(sys.stdin.read(), False, "request")
    try:
        request = deUnicodeDict(simplejson.loads(data))
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
