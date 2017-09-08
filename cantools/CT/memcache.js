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
	_rq: function(action, cb, key, val, params, netargs) {
		params = CT.merge(params, {
			action: action,
			key: key
		});
		if (val) {
			if (params.mode == "blob")
				return CT.net.formUp(val, CT.merge(netargs, {
					cb: cb,
					params: params,
					path: "/_memcache"
				}), "value");
			params.value = val;
		}
		CT.net.post(CT.merge(netargs, {
			cb: cb,
			params: params,
			path: "/_memcache"
		}));
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

CT.memcache.blob = {
	get: function(key, cb, btype) {
		CT.memcache._rq("get", function(data) {
			cb(new Blob([data], { type : btype }));
		}, key, null, { mode: "blob" }, { basic: true, responseType: "blob" });
	},
	set: function(key, blob, cb, transcode) {
		var opts = { mode: "blob" };
		if (transcode) // transcoding doesn't work well for chrome-generated webm chunks
			opts.transcode = true;
		CT.memcache._rq("set", cb, key, blob, opts);
	}
};

CT.memcache.countdown = {
	get: function(key, cb) {
		CT.memcache._rq("get", cb, key, null, { mode: "countdown" });
	},
	set: function(key, seconds, cb, meta) {
		var params = { mode: "countdown" };
		if (meta)
			params.meta = meta;
		CT.memcache._rq("set", cb, key, seconds, params);
	},
	list: function(cb) {
		CT.memcache._rq("get", cb, "_countdown_list", null, { mode: "countdown" });
	}
};