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
		},
		load: function(key) {
			var _ = CT.bound._, oz = _.opts, dboz = oz.db;
			if (!CT.data.get(key)) {
				if (oz.storage)
					CT.data.add(CT.storage.get(key) || { key: key });
				else if (dboz.auto || dboz.pw) {
					
				}
			}
		}
	},
	register: function(key, node, constructor) {
		var _ = CT.bound._, kz = _.keys;
		node._constructor = constructor;
		if (!kz[key]) {
			kz[key] = [];
			_.load(key);
		}
		kz[key].push(node);
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