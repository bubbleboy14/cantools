CT.admin.db = {
	"init": function() {
		CT.log("acquiring db schema");
		CT.require("admin.dbcfg", true);
		CT.log("got it");
		CT.panel.simple("db", Object.keys(admin.dbcfg));
	},
	"get": function(modelName, cb, limit, offset) {
		limit = limit || 20;
		offset  = offset || 0;
		CT.admin.core.q("db", cb,
			"failed to get " + modelName + " (limit " + limit + "; offset " + offset, {
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