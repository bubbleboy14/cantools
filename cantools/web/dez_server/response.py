import json
from rel import abort_branch, timeout
from dez.http.server import HTTPResponse
from cantools import config
from ..util import *

files = {}

class Response(object):
    def __init__(self, request):
        self.id = request.id
        self.request = request
        self.response = HTTPResponse(request)

    def _read(self):
        b = self.request.body or json.dumps(rec_conv(self.request.qs_params))
        ctype = self.request.headers.get("content-type")
        if ctype and ctype.startswith("multipart/form-data"):
            obj = {}
            splitter, body = b.rsplit("\r\n", 2)[0].split("\r\n", 1)
            for chunk in body.split("\r\n%s\r\n"%(splitter,)):
                nameline, data = chunk.split("\r\n\r\n")
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
        if config.web.xorigin:
            self.response.headers["Access-Control-Allow-Origin"] = "*"
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

