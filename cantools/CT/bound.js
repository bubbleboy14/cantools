CT.bound = {
	keys: {},
	opts: {
		db: {
			pw: null,
			auto: false
		},
		storage: {} // set to false or null to disable
	},
	register: function(key, node, constructor) {
		var kz = CT.bound.keys,
			kzk = kz[key] = kz[key] || [];
		node._constructor = constructor;
		kzk.push(node);
	},
	mutate: function(data) {
		CT.data.add(data);
		var nodez = CT.bound.keys[data.key],
			fulld = CT.data.get(data.key), params = {
				action: "edit",
				data: data
			}, oz = CT.bound.opts, dboz = oz.db;
		nodez && nodez.forEach(function(node) {
			CT.dom.setContent(node, node._constructor(fulld));
		});
		if (oz.storage)
			CT.storage.set(data.key, fulld);
		if (dboz.auto || dboz.pw) {
			if (dboz.pw)
				params.pw = dboz.pw;
			CT.net.post({
				path: "/_db",
				params: params
			});
		}
	},
	init: function(opts) {
		var opts = CT.bound.opts = CT.merge(opts, CT.bound.opts);
		if (opts.storage) {
			CT.storage.init(opts.storage);
			// acquire/load initial stored objects?
		}
	}
};