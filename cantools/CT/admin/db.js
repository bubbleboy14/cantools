CT.admin.db = {
	"init": function() {
		CT.log("acquiring db schema");
		CT.admin.db.starred = CT.dom.id("dbstarred");
		CT.admin.core.init("db", function(schema) {
			var skeys = Object.keys(schema);
			CT.log("got schema with " + skeys.length + " tables");
			CT.admin.db.schema = schema;
			CT.panel.simple(skeys, "db");
			for (var i = 0; i < skeys.length; i++)
				CT.dom.id("dbcontent" + skeys[i],
					true).appendChild(CT.panel.pager(CT.admin.db._build(skeys[i]),
					CT.admin.db._refill(skeys[i]), 10, "rcol", "data", skeys[i]));
		});
	},
	"get": function(modelName, cb, limit, offset) {
		limit = limit || 20;
		offset  = offset || 0;
		CT.admin.core.q("db", cb, ["failed to get", modelName,
			"- limit", limit, "offset", offset].join(" "), {
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
	},
	"star": function(k) {
		CT.log("CT.admin.db.star: " + k);
		var d = CT.data.get(k), key = d.key + "starred",
			b = CT.dom.button(CT.dom.id(key) ? "Unstar" : "Star", function() {
				if (b.innerHTML == "Star") {
					b.innerHTML = "Unstar";
					CT.admin.db.starLink(d);
				} else {
					b.innerHTML = "Star";
					CT.dom.remove(CT.dom.id(key));
				}
			});
		return b;
	},
	"key2model": function(key) {
		return JSON.parse(atob(key)).model;
	},
	"starLink": function(d) {
		var label = d.label || d.key,
			k = label + "starred",
			slink = CT.dom.id(k);
		if (!slink) {
			slink = CT.dom.node(CT.dom.link(label), function() {
				var dobj = {};
				dobj.db = CT.admin.db.key2model(d.key);
				dobj[dobj.db] = d.label;
				CT.panel.drill(dobj);
			}, "div", "pointer", k);
			CT.admin.db.starred.appendChild(slink);
		}
		return slink;
	}
};

CT.admin.db.Editor = CT.Class({
	"CLASSNAME": "CT.admin.db.Editor",
	"_submit": function() {
		this.log("_submit");
		var data = this.data, changes = {}, params = {
			"key": "edit",
			"data": changes
		};
		if (data.key)
			changes.key = data.key;
		else
			changes.modelName = this.modelName;
		this.inputs.forEach(function(ip) {
			var val = ip.getValue();
			if (val != data[ip.rowKey])
				changes[ip.rowKey] = val;
		});
		CT.admin.core.q("db", function() {
			alert("you did it");
		}, "edit failed", params);
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
			"node": this._mtable(key)
		})).show();
	},
	"_mtable": function(key) {
		var k, d = CT.data.get(key), n = CT.dom.node();
		for (k in d)
			n.appendChild(CT.dom.node([
				CT.dom.node(k + ":", "div", "keycell"),
				CT.dom.node(d[k] || "(none)", "span")
			], "div", "lister"));
		n.appendChild(CT.dom.button("change"));
		n.appendChild(CT.dom.button("edit", function() {
			CT.admin.db.starLink(d).onclick();
		}));
		return n;
	},
	"_entity": function(key) {
		if (!key) return CT.dom.node("null");
		var that = this, n = CT.dom.node(),
			vdata = CT.data.get(key);
		this.log("_entity", key, vdata);
		var fill = function(d) {
			n.appendChild(CT.dom.link((d.label || d.key),
				function() { that._modal(key); }));
		};
		if (vdata)
			fill(vdata);
		else
			CT.admin.core.q("db", function(d) {
				CT.data.add(d);
				fill(d);
			}, "failed to get " + key, { "key": key });
		return n;
	},
	"_row": function(k) {
		var val = this.data[k], valcell, ptype,
			rownode = CT.dom.node("", "div", "lister");
		rownode.appendChild(CT.dom.node(k + ":", "div", "keycell"));
		ptype = rownode.ptype = this.schema[k];
		if (ptype == "key")
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
			valcell.rowKey = k;
			this.inputs.push(valcell);
		} else
			valcell = CT.dom.node(val, "span");
		rownode.appendChild(valcell);
		return rownode;
	},
	"_table": function() {
		var k, r, n = this.node = CT.dom.node(); // TODO: list, maybe zipcode
		["string", "integer", "float", "bool", "key"].forEach(function(t) {
			n[t] = CT.dom.node();
			n.appendChild(n[t]);
		});
		for (k in this.data) {
			r = this._row(k);
			(n[r.ptype] || n).appendChild(r);
		}
		n.appendChild(CT.dom.button("Submit", this._submit));
		n.appendChild(CT.admin.db.star(this.data.key));
	},
	"init": function(model, data) {
		this.modelName = model;
		this.schema = CT.admin.db.schema[model];
		this.data = data;
		this.inputs = [];
		this._table();
	}
});