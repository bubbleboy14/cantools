/*
This module provides direct integration with the cantools memcache service via
the _memcache.py request handler. Some key functions are defined below.

### CT.memcache.get(key, cb, localCache)
Return the (server-side) value for the specified key.

### CT.memcache.set(key, val, cb, localCache)
Instruct the server to remember the specified key and value.

### CT.memcache.forget(key, cb, localCache)
Instruct the server to forget the specified key and any associated value.

### CT.memcache.countdown.get(key, cb)
Return the (server-side) TTL and token for the specified key.

### CT.memcache.countdown.set(key, seconds, cb)
Instruct the server to associate a countdown (seconds in the future) and token
(randomly-generated) with the specified key.
*/

CT.memcache = {
	_local: {},
	_rq: function(action, cb, key, val, countdown) {
		CT.net.post("/_memcache", {
			action: action,
			key: key,
			value: val,
			countdown: countdown
		}, null, cb);
	},
	get: function(key, cb, localCache) {
		var local = localCache && CT.memcache._local[key];
		if (local)
			cb(local);
		else
			CT.memcache._rq("get", cb, key);
	},
	set: function(key, val, cb, localCache) {
		if (localCache)
			CT.memcache._local[key] = val;
		CT.memcache._rq("set", cb, key, val);
	},
	forget: function(key, cb, localCache) {
		if (localCache && CT.memcache._local[key])
			delete CT.memcache._local[key];
		CT.memcache._rq("forget", cb, key);
	}
};

CT.memcache.countdown = {
	get: function(key, cb) {
		CT.memcache._rq("get", cb, key, null, true);
	},
	set: function(key, seconds, cb) {
		CT.memcache._rq("set", cb, key, seconds, true);
	}
}