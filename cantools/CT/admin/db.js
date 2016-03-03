CT.admin.db = {
	"_d": {
		"string": "",
		"integer": 0,
		"float": 0.0,
		"boolean": false,
		"key": null
	},
	"unimplemented": ["datetimeautostamper", "list"], // no editing (yet) :)
	"init": function() {
		CT.log("acquiring db schema");
		CT.admin.db.starred = CT.dom.id("dbstarred");
		CT.admin.core.init("db", function(schema) {
			var skeys = Object.keys(schema);
			CT.log("got schema with " + skeys.length + " tables");
			CT.admin.db.schema = schema;
			CT.panel.simple(skeys, "db");
			skeys.forEach(function(modelName) {
				var pnode = CT.dom.id("dbpanel" + modelName);
				CT.dom.id("dbcontent" + modelName).appendChild(CT.panel.pager(CT.admin.db._build(modelName),
					CT.admin.db._refill(modelName), 10, "rcol", "data", modelName));
				pnode.insertBefore(CT.dom.node([
					CT.dom.button("new query", function() {
						CT.admin.db.query(modelName);
					}),
					CT.dom.button("new " + modelName, function() {
						CT.admin.db.starLink(CT.admin.db._defaults(modelName), modelName).onclick();
					})
				], "div", "right"), pnode.firstChild);
			});
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
	"_defaults": function(modelName) {
		var k, d = { "label": "new " + modelName },
			schema = CT.admin.db.schema[modelName];
		for (k in schema)
			d[k] = CT.admin.db._d[schema[k]];
		return d;
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
	"_add": function(modelName, d) {
		CT.panel.add(d.label, false, modelName);
		CT.dom.id(modelName + "content" + d.label.replace(/ /g,
			"")).appendChild(CT.admin.db._build(modelName)(d));
	},
	"star": function(k) {
		CT.log("CT.admin.db.star: " + k);
		var d = CT.data.get(k), key = "starreditem" + (d.label || d.key).replace(/ /g, ""),
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
	"starLink": function(d, modelName) {
		var label = d.label || d.key,
			k = "starreditem" + label.replace(/ /g, ""),
			slink = CT.dom.id(k);
		if (!slink) {
			slink = CT.dom.node(CT.dom.link(label, function() {
				var dobj = {}, nslabel = (d.label || d.key).replace(/ /g, "");
				dobj.db = modelName || CT.admin.db.key2model(d.key);
				dobj[dobj.db] = d.label;
				if (!CT.dom.id(dobj.db + "panel" + nslabel))
					CT.admin.db._add(dobj.db, d);
				CT.panel.drill(dobj);
			}), "div", "pointer", k);
			CT.admin.db.starred.appendChild(slink);
		}
		return slink.firstChild;
	},
	"query": function(modelName) {
		(new CT.modal.Modal({
			"node": (new CT.admin.db.Query(modelName)).node
		})).show();
	},
	"_val": function(f, ptype) {
		return function() {
			if (ptype == "boolean")
				return f.checked;
			if (ptype == "integer")
				return parseInt(f.value);
			if (ptype == "float")
				return parseFloat(f.value);
			return f.value; // string
		};
	},
	"input": function(k, ptype, val) {
		var valcell;
		if (ptype == "string")
			valcell = CT.dom.field(null, val);
		else if (ptype == "boolean")
			valcell = CT.dom.checkbox(null, val);
		else if (ptype == "float")
			valcell = CT.parse.numOnly(CT.dom.field(null, val), true);
		else if (ptype == "integer")
			valcell = CT.parse.numOnly(CT.dom.field(null, val));
		valcell.getValue = CT.admin.db._val(valcell, ptype);
		valcell.rowKey = k;
		return valcell;
	}
};

CT.admin.db.Query = CT.Class({
	"CLASSNAME": "CT.admin.db.Query",
	"_filters": [],
	"_filter": function() {
		var valcell = CT.dom.node(null, "span"), schema = this.schema,
			selectcell = CT.dom.select(Object.keys(schema).filter(function(prop) {
				return CT.admin.db.unimplemented.indexOf(schema[prop]) == -1;
			}));
		selectcell.onchange = function() {
			CT.log(selectcell.value);
			CT.dom.setContent(valcell,
				CT.admin.db.input(selectcell.value, schema[selectcell.value]));
		};
		selectcell.onchange();
		this.node.appendChild(CT.dom.node([selectcell, valcell]));
	},
	"_build": function() {
		this.node = CT.dom.node([
			CT.dom.node(CT.dom.button("add filter", this._filter), "div", "right"),
			CT.dom.node(this.modelName + " query", "div", "big bold")
		]);
	},
	"init": function(modelName) {
		this.modelName = modelName;
		this.schema = CT.admin.db.schema[modelName];
		this._build();
	}
});

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
		CT.admin.core.q("db", function(resp) {
			for (var k in changes)
				data[k] = changes[k];
			if (!data.key) {
				data.key = resp.key;
				CT.data.add(data);
			}
			if (data.label != resp.label) {
				CT.panel.rename(data.label, resp.label, changes.modelName, "starred");
				CT.dom.id()
				data.label = resp.label;
			}
			alert("you did it");
		}, "edit failed", params);
	},
	"_modal": function(key) {
		this.log("_modal", key);
		(new CT.modal.Modal({
			"node": this._mtable(key)
		})).show();
	},
	"_mtable": function(key) {
		var k, d = CT.data.get(key), my_d = this.data, n = CT.dom.node();
		for (k in d)
			n.appendChild(CT.dom.node([
				CT.dom.node(k + ":", "div", "keycell"),
				CT.dom.node(d[k] || "(none)", "span")
			], "div", "lister"));
		n.appendChild(CT.dom.button("change"));
		n.appendChild(CT.dom.button("edit", function() {
			CT.admin.db.starLink(my_d);
			CT.admin.db.starLink(d).onclick();
			n.parentNode.modal.hide();
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
		else if (ptype && CT.admin.db.unimplemented.indexOf(ptype) == -1) {
			valcell = CT.admin.db.input(k, ptype, val);
			this.inputs.push(valcell);
		} else
			valcell = CT.dom.node(val || "null", "span");
		rownode.appendChild(valcell);
		return rownode;
	},
	"_table": function() {
		var k, r, d = this.data, n = this.node = CT.dom.node();
		["string", "integer", "float", "bool", "key"].forEach(function(t) {
			// TODO: list, datetimeautostamper (when they work)
			n[t] = CT.dom.node();
			n.appendChild(n[t]);
		});
		for (k in d) {
			r = this._row(k);
			(n[r.ptype] || n).appendChild(r);
		}
		d.key && n.appendChild(CT.dom.node(CT.dom.button("Delete", function() {
			var label = d.label || d.key;
			if (!confirm("really delete " + label + "?"))
				return;
			CT.dom.remove(CT.dom.id("starreditem" + label.replace(/ /g, "")));
			CT.admin.core.q("db", function() {
				n.parentNode.parentNode.parentNode.parentNode.pager.remove(d);
				alert("deleted: " + label);
			}, "failed to delete " + label, {
				"key": "delete",
				"data": d.key
			});
		}, "red"), "div", "right"));
		n.appendChild(CT.dom.button("Submit", this._submit));
		d.key && n.appendChild(CT.admin.db.star(d.key));
	},
	"init": function(model, data) {
		this.modelName = model;
		this.schema = CT.admin.db.schema[model];
		this.data = data;
		this.inputs = [];
		this._table();
	}
});