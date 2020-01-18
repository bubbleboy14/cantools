CT.bound = {
	_: {
		keys: {},
		opts: {
			db: {
				pw: null,
				auto: false
			},
			storage: {} // set to false or null to disable
		},
		set: function(data) {
			var _ = CT.bound._, oz = _.opts, dboz = oz.db, params, fulld;
			CT.data.add(data);
			fulld = CT.data.get(data.key);
			if (oz.storage)
				CT.storage.set(data.key, fulld);
			if (dboz.auto || dboz.pw) {
				params = {
					action: "edit",
					data: data
				};
				if (dboz.pw)
					params.pw = dboz.pw;
				CT.net.post({
					path: "/_db",
					params: params
				});
			}
			return fulld;
		}
	},
	register: function(key, node, constructor) {
		var _ = CT.bound._, kz = _.keys,
			kzk = kz[key] = kz[key] || [];
		node._constructor = constructor;
		kzk.push(node);
	},
	mutate: function(data) {
		var _ = CT.bound._, fulld = _.set(data);
		(_.keys[data.key] || []).forEach(function(node) {
			CT.dom.setContent(node, node._constructor(fulld));
		});
	},
	init: function(opts) {
		var _ = CT.bound._, opts = _.opts = CT.merge(opts, _.opts);
		if (opts.storage) {
			CT.storage.init(opts.storage);
			// acquire/load initial stored objects?
		}
	}
};