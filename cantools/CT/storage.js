/*
This module provides an abstraction layer over a storage backend.

### Here are the obvious functions:
    - CT.storage.get(key)
    - CT.storage.set(key, val)
    - CT.storage.clear()

### You also have to call CT.storage.init(opts). The 'opts' object may contain:
    - backend (one of: localStorage, sessionStorage) - default: localStorage
    - json (bool) - default: true
    - compress (bool) - default: true

Why call init(), you ask? Well, if 'compress' is true, the storage module
needs to lazily import CT.lib.lz-string. Could be different, but there it is.
*/

CT.storage = {
	"init": function(opts) {
		if (!CT.storage.opts) {
			var backend;
			try {
				backend = localStorage; // could also be sessionStorage
			} catch(e) {
				backend = CT.storage._fake();
			}
			CT.storage.opts = CT.merge(opts, {
				"backend": backend,
				"json": true,
				"compress": true
			});
			if (CT.storage.opts.compress)
				CT.require("CT.lib.lz_string", true);
		}
		return CT.storage.opts;
	},
	"_fake": function() {
		var faker = {};
		return {
			setItem: function(k, v) {
				faker[k] = v;
			},
			getItem: function(k) {
				return faker[k];
			}
		};
	},
	"_jsp": function(s) {
		try {
			return JSON.parse(s);
		} catch(err) {
			return null;
		}
	},
	"get": function(key) {
		var opts = CT.storage.init(),
			val = opts.backend.getItem(key);
		if (opts.compress)
			val = LZString.decompress(val);
		return opts.json ? CT.storage._jsp(val) : val;
	},
	"set": function(key, val) {
		var opts = CT.storage.init();
		if (opts.json)
			val = JSON.stringify(val);
		if (opts.compress)
			val = LZString.compress(val);
		opts.backend.setItem(key, val);
	},
	"clear": function() {
		CT.storage.init().backend.clear();
	}
};