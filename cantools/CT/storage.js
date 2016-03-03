CT.storage = {
	"init": function(opts) {
		if (!CT.storage.opts) {
			CT.storage.opts = CT.merge(opts, {
				"backend": localStorage, // could also be sessionStorage
				"json": true,
				"compress": true
			});
			if (CT.storage.opts.compress)
				CT.require("CT.lib.lz-string", true);
		}
		return CT.storage.opts;
	},
	"get": function(key) {
		var opts = CT.storage.init(),
			val = opts.backend.getItem(key);
		if (opts.compress)
			val = LZString.decompress(val);
		return opts.json ? JSON.parse(val) : val;
	},
	"set": function(key, val) {
		var opts = CT.storage.init();
		if (opts.json)
			val = JSON.stringify(val);
		if (opts.compress)
			val = LZString.compress(val);
		opts.backend.setItem(key, val);
	}
};