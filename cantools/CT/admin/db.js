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
					true).appendChild(CT.panel.pager(CT.admin.db._build(skeys[i]),
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
	"_build": function(modelName) {
		var f = function(obj) {
			return (new CT.admin.db.Editor(modelName, obj)).node;
		};
		return f;
	}
};

CT.admin.db.Editor = CT.Class({
	"_submit": function() {
		this.log("_submit");
	},
	"_input": function(f, ptype) {
		return function() {
			if (ptype == "boolean")
				return f.checked;
			if (ptype == "integer")
				return parseInt(f.value) || null;
			if (ptype == "float")
				return parseFloat(f.value) || null;
			return f.value; // string
		};
	},
	"_modal": function(key) {
		this.log("_modal", key);
		(new CT.modal.Modal({
			"node": CT.dom.node(JSON.stringify(CT.data.get(key)))
		})).show();
	},
	"_entity": function(key) {
		var vdata = CT.data.get(key);
		this.log("_entity", key, vdata);
		return vdata ? CT.dom.node(CT.dom.link((vdata.label || vdata.key),
			function() { this._modal(key); }.bind(this))) : CT.dom.node(key);
	},
	"_row": function(k) {
		var val = this.data[k], valcell, ptype,
			rownode = CT.dom.node("", "div", "lister");
		rownode.appendChild(CT.dom.node(k + ":", "div", "keycell"));
		ptype = rownode.ptype = this.schema[k];
		if (ptype == "keytype")
			valcell = this._entity(val);
		else if (ptype) {
			if (ptype == "string")
				valcell = CT.dom.field(null, val);
			else if (ptype == "boolean")
				valcell = CT.dom.checkbox(null, val);
			else if (ptype == "float")
				valcell = CT.parse.numOnly(CT.dom.field(null, val), true);
			else if (ptype == "integer")
				valcell = CT.parse.numOnly(CT.dom.field(null, val));
			valcell.getValue = this._input(valcell, ptype);
		} else
			valcell = CT.dom.node(val, "span");
		rownode.appendChild(valcell);
		return rownode;
	},
	"_table": function() {
		var k, r, n = this.node = CT.dom.node(); // TODO: list, maybe zipcode
		["string", "integer", "float", "bool", "keytype"].forEach(function(t) {
			n[t] = CT.dom.node();
			n.appendChild(n[t]);
		});
		for (k in this.data) {
			r = this._row(k);
			(n[r.ptype] || n).appendChild(r);
		}
		n.appendChild(CT.dom.button("Submit", this._submit));
	},
	"init": function(model, data) {
		this.log = CT.log.getLogger("Editor(" + model + ")");
		this.schema = CT.admin.db.schema[model];
		this.data = data;
		this._table();
	}
});