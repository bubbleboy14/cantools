CT.admin.db = {
	"init": function() {
		CT.log("acquiring db schema");
		CT.admin.core.init("db", function(schema) {
			var skeys = Object.keys(schema);
			CT.log("got schema with " + skeys.length + " tables");
			CT.panel.simple("db", skeys);
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
	"load": function(modelName) {
		var panel = CT.dom.id("dbcontent" + modelName);
		CT.admin.db.get(modelName, function(d) {
			CT.log("got " + d.length + " " + modelName + " records");
			var n = [];
			d.forEach(function(p) {
				n.push(p.name);
			});
			CT.panel.simple(modelName, n);
			CT.log(modelName + "s loaded");
		});
	}
};