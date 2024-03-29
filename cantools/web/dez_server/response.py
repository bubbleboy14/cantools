import json
from rel import abort_branch, timeout
from dez.http.server import HTTPResponse
from cantools import config
from ..util import *

files = {}

class Response(object):
    def __init__(self, request):
        self.id = request.id
        self.ip = request.real_ip
        self.request = request
        self.response = HTTPResponse(request)

    def _read(self):
        b = self.request.body or json.dumps(rec_conv(self.request.qs_params))
#        print(b)
        ctype = self.request.headers.get("content-type")
        if ctype and ctype.startswith("multipart/form-data"):
            if type(b) != bytes:
                b = b.encode()
            obj = {}
            splitter, body = b.rsplit(b"\r\n", 2)[0].split(b"\r\n", 1)
            for chunk in body.split(b"\r\n%s\r\n"%(splitter,)):
                nameline, data = chunk.split(b"\r\n\r\n", 1)
                nameline = nameline.decode()
                name = nameline.split("; filename=")[0][:-1].split('name="')[1]
                if "filename=" in nameline:
                    signature = "%s%s"%(self.id, name)
                    files[signature] = data
                    obj[name] = signature
                else:
                    obj[name] = data
            b = json.dumps(rec_conv(obj))
        return b

    def _send(self, *args, **kwargs):
        wcfg = config.web
        if wcfg.xorigin:
            self.response.headers["Access-Control-Allow-Origin"] = "*"
        if wcfg.csp:
            if wcfg.csp.startswith("auto"):
                d = wcfg.domain
                if wcfg.csp != "autosub":
                    d = ".".join(d.split(".")[-2:])
                wcfg.update("csp", "default-src 'self' %s *.%s"%(d, d))
            self.response.headers["Content-Security-Policy"] = wcfg.csp
        self.response.write(*args, **kwargs)

    def _close(self):
        timeout(.001, self.response.dispatch)
        abort_branch()

    def _header(self, *args, **kwargs):
        self.response.__setitem__(*args, **kwargs)

    def set_cbs(self):
        set_read(self._read)
        set_header(self._header)
        set_send(self._send)
        set_close(self._close)
        set_redir(self.response.redirect)
