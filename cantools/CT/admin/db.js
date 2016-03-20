CT.admin.db = {
	"init": function() {
		CT.admin.db.starred = CT.dom.id("dbstarred");
		CT.admin.core.init("db", function() {
			CT.db.init({
				cb: function(schema) {
					var skeys = Object.keys(schema);
					CT.panel.simple(skeys, "db");
					skeys.forEach(function(modelName) {
						CT.db.pager(modelName);
					});
				},
				builder: CT.admin.db._build,
				post_pager: CT.admin.db._post_pager
			});
		}, true);
	},
	"_post_pager": function(key, modelName) {
		var pnode = CT.dom.id("dbpanel" + key);
		pnode.insertBefore(CT.dom.node([
			CT.dom.button("new query", function() {
				CT.db.query(modelName, "fade", true);
			}),
			CT.dom.button("new " + modelName, function() {
				CT.admin.db.starLink(CT.db.getDefaults(modelName,
					{ "label": "new " + modelName }), modelName).onclick();
			})
		], "div", "right"), pnode.firstChild);
	},
	"_build": function(modelName) {
		return function(obj) {
			return (new CT.admin.db.Editor(modelName, obj)).node;
		};
	},
	"_add": function(modelName, d) {
		CT.panel.add(d.label, false, modelName);
		CT.dom.id(modelName + "content" + d.label.replace(/ /g,
			"")).appendChild(CT.admin.db._build(modelName)(d));
	},
	"star": function(k) {
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
	"starLink": function(d, modelName) {
		var label = d.label || d.key,
			k = "starreditem" + label.replace(/ /g, ""),
			slink = CT.dom.id(k);
		if (!slink) {
			slink = CT.dom.node(CT.dom.link(label, function() {
				var dobj = {}, nslabel = (d.label || d.key).replace(/ /g, "");
				dobj.db = modelName || CT.db.key2model(d.key);
				dobj[dobj.db] = d.label;
				if (!CT.dom.id(dobj.db + "panel" + nslabel))
					CT.admin.db._add(dobj.db, d);
				CT.panel.drill(dobj);
			}), "div", "pointer", k);
			CT.admin.db.starred.appendChild(slink);
		}
		return slink.firstChild;
	}
};

CT.admin.db.Editor = CT.Class({
	"CLASSNAME": "CT.admin.db.Editor",
	"_submit": function() {
		this.log("_submit");
		var data = this.data, changes = {};
		if (data.key)
			changes.key = data.key;
		else
			changes.modelName = this.modelName;
		this.inputs.forEach(function(ip) {
			var val = ip.getValue();
			if (val != data[ip.rowKey])
				changes[ip.rowKey] = val;
		});
		CT.admin.core.q("edit", function(resp) {
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
		}, "edit failed", { data: changes }, "/_db");
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
			CT.admin.core.q("get", function(d) {
				CT.data.add(d);
				fill(d);
			}, "failed to get " + key, { "key": key }, "/_db");
		return n;
	},
	"_row": function(k) {
		var val = this.data[k], valcell, ptype,
			rownode = CT.dom.node("", "div", "lister");
		rownode.appendChild(CT.dom.node(k + ":", "div", "keycell"));
		ptype = rownode.ptype = this.schema[k];
		if (ptype == "key")
			valcell = this._entity(val);
		else if (CT.db.edit.isSupported(ptype)) {
			valcell = CT.db.edit.input(k, ptype, val);
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
			CT.admin.core.q("delete", function() {
				n.parentNode.parentNode.parentNode.parentNode.pager.remove(d);
				alert("deleted: " + label);
			}, "failed to delete " + label, {
				"key": d.key
			}, "/_db");
		}, "red"), "div", "right"));
		n.appendChild(CT.dom.button("Submit", this._submit));
		d.key && n.appendChild(CT.admin.db.star(d.key));
	},
	"init": function(model, data) {
		this.modelName = model;
		this.schema = CT.db.getSchema(model);
		this.data = data;
		this.inputs = [];
		this._table();
	}
});