/*
This module provides direct integration with the cantools memcache service via
the _memcache.py request handler. Some key functions are defined below.

### CT.memcache.get(key, cb, json)
Return the (server-side) value for the specified key.

### CT.memcache.set(key, val, cb, json)
Instruct the server to remember the specified key and value.
*/

CT.memcache = {
	_rq: function(action, cb, json, key, val) {
		CT.net.post("/_memcache", {
			action: action,
			key: key,
			value: val,
			json: json
		}, null, cb);
	},
	get: function(key, cb, json) {
		CT.memcache._rq("get", cb, json, key);
	},
	set: function(key, val, cb, json) {
		CT.memcache._rq("set", cb, json, key, val);
	}
};