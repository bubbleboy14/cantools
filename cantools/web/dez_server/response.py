import json
from rel import abort_branch, timeout
from dez.http.server import HTTPResponse
from ..util import *

class Response(object):
	def __init__(self, request):
		self.id = request.id
		self.request = request
		self.response = HTTPResponse(request)

	def _read(self):
		return self.request.body or json.dumps(rb64(self.request.qs_params))

	def _send(self, *args, **kwargs):
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

