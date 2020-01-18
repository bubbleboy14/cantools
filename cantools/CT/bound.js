/*
This module contains functions for binding DOM nodes and constructor
functions to data objects (by key). When the data changes, the bound
nodes are updated according to their constructor functions. Supports
two modes, storage and db.

### Primary functions:
	- CT.bound.register(key, node, constructor)
	- CT.bound.mutate(data)

### Usage:

	CT.onload(function() {
		var n = CT.dom.div(),
			b = CT.dom.div(null, "abs cbr biggest");
		CT.dom.setBody([n, b]);
		CT.bound.register("main", n, function(data) {
			return JSON.stringify(data);
		});
		CT.bound.register("main", b, function(data) {
			return data.anything;
		});
		CT.bound.mutate({
			key: "main",
			something: "whatever",
			anything: "nothing"
		});
	});
*/

CT.bound = {
	_: {
		keys: {},
		opts: {
			mode: "storage",
			storage: {},
			db: {}
		},
		set: function(data) {
			var _ = CT.bound._, oz = _.opts, dboz = oz.db, params, fulld;
			CT.data.add(data);
			fulld = CT.data.get(data.key);
			if (oz.mode == "storage")
				CT.storage.set(data.key, fulld);
			else {
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
				if (oz.mode == "storage")
					CT.data.add(CT.storage.get(key) || { key: key });
				else
					CT.db.one(key);
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
	init: function(opts) { // only necessary for custom opts{}
		var _ = CT.bound._, opts = _.opts = CT.merge(opts, _.opts);
		if (opts.mode == "storage")
			CT.storage.init(opts.storage);
	}
};