CT.admin.db = {
	"init": function() {
		CT.log("acquiring db schema");
		CT.admin.core.init("db", function(schema) {
			var skeys = Object.keys(schema);
			CT.log("got schema with " + skeys.length + " tables");
			CT.admin.db.schema = schema;
			CT.panel.simple(skeys, "db");
			for (var i = 0; i < skeys.length; i++)
				CT.dom.id("dbcontent" + skeys[i],
					true).appendChild(CT.panel.pager(CT.admin.db._build,
					CT.admin.db._refill(skeys[i]), 10, "rcol", "data"));
		});
	},
	"get": function(modelName, cb, limit, offset) {
		limit = limit || 20;
		offset  = offset || 0;
		CT.admin.core.q("db", cb,
			"failed to get " + modelName + " (limit " + limit + "; offset " + offset + ")", {
				"modelName": modelName,
				"limit": limit,
				"offset": offset
			});
	},
	"_refill": function(modelName) {
		var f = function(obj, cb) {
			CT.admin.db.get(modelName, cb, obj.limit, obj.offset);
		};
		return f;
	},
	"_build": function(obj) {
		return CT.dom.node(JSON.stringify(obj));
	}
};