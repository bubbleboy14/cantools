CT.admin.db = {
	"init": function() {
		CT.admin.db.starred = CT.dom.id("dbstarred");
		var stog = CT.dom.id("dbstarredtoggle");
		stog.onclick = function() {
			if (stog.innerHTML == "-") {
				stog.innerHTML = "+";
				CT.admin.db.starred.classList.add("hm20p");
			} else {
				stog.innerHTML = "-";
				CT.admin.db.starred.classList.remove("hm20p");
			}
		};
		CT.admin.core.init("db", function() {
			CT.db.init({
				cb: function(schema) {
					var skeys = Object.keys(schema);
					CT.panel.simple({
						pnames: skeys,
						keystring: "db",
						view1: function(modelName) {
							CT.db.pager(modelName);
						}
					});
				},
				builder: CT.admin.db._build,
				post_pager: CT.admin.db._post_pager
			});
		}, true);
	},
	"_post_pager": function(key, modelName, startYear) {
		var pnode = CT.dom.id("dbpanel" + key);
		pnode.insertBefore(CT.dom.node([
			CT.dom.button("new query", function() {
				CT.db.query({
					modelName: modelName,
					startYear: startYear || 1970, // gotta start somewhere...
					showHelp: true
				}, "fade");
			}),
			CT.dom.button("new " + modelName, function() {
				CT.admin.db.starLink(CT.db.edit.getDefaults(modelName,
					{ "label": "new " + modelName }), modelName).onclick();
			}),
			CT.dom.button("bulk upload", function() {
				(new CT.modal.Prompt({
					noClose: true,
					style: "file",
					transition: "slide",
					cb: function(ctfile) {
						ctfile.upload("/_db", function() {
							if (confirm("Nice work! Reload for new stuff?"))
								location.reload();
						}, {
							action: "bulk",
							modelName: modelName,
							pw: CT.admin.core._pw
						});
					}
				})).show();
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
		var d = CT.data.get(k), key = "starreditem" + d.label.replace(/ /g, ""),
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
		var label = d.label,
			k = "starreditem" + label.replace(/ /g, ""),
			slink = CT.dom.id(k);
		if (!slink) {
			slink = CT.dom.node(CT.dom.link(label, function() {
				var dobj = {}, nslabel = label.replace(/ /g, "");
				dobj.db = modelName || CT.db.key2model(d.key);
				dobj[dobj.db] = label;
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
	"_order": ["string", "text", "integer", "float", "datetime", "boolean", "list", "keylist", "key", "blob"],
	"_submit": function() {
		var data = this.data, blobs = this.blobs, n = this.node,
			delnode = this._delete, changes = {};
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
				CT.dom.show(delnode);
				n.appendChild(CT.admin.db.star(data.key));
				blobs.forEach(function(b) {
					b.blob.keyUp(resp.key);
				});
			}
			if (data.label != resp.label) {
				CT.panel.rename(data.label, resp.label, data.modelName, "starred");
				data.label = resp.label;
			}
			alert("you did it");
		}, "edit failed", { data: changes }, "/_db");
	},
	"_row": function(k) {
		var val = this.data[k], valcell, ptype,
			rownode = CT.dom.node("", "div", "lister");
		rownode.appendChild(CT.dom.node(k + ":", "div", "keycell"));
		ptype = rownode.ptype = this.schema[k];
		if (CT.db.edit.isSupported(ptype, k)) {
			valcell = CT.db.edit.input(k, ptype, val, this.modelName, {
				key: this.data.key,
				startYear: 1970 // gotta start somewhere, might as well be epoch...
			});
			if (ptype == "blob") // handled separately by upload/download links
				this.blobs.push(valcell);
			else {
				this.inputs.push(valcell);
				if (valcell.addButton) { // list, keylist
					rownode.appendChild(valcell.addButton);
					rownode.appendChild(valcell.empty);
				}
			}
		} else
			valcell = CT.dom.node(val || "null", "span");
		rownode.appendChild(valcell);
		return rownode;
	},
	"_table": function() {
		var k, r, d = this.data, n = this.node = CT.dom.node();
		this._order.forEach(function(t) {
			n[t] = CT.dom.node();
			n.appendChild(n[t]);
		});
		n.appendChild(CT.dom.br());
		for (k in d) {
			r = this._row(k);
			(k != "_label" && n[r.ptype] || n).appendChild(r);
		}
		this._delete = CT.dom.node(CT.dom.button("Delete", function() {
			var label = d.label;
			if (!confirm("really delete " + label + "?"))
				return;
			CT.dom.remove(CT.dom.id("starreditem" + label.replace(/ /g, "")));
			CT.admin.core.q("delete", function() {
				n.parentNode.parentNode.parentNode.parentNode.pager.remove(d);
				alert("deleted: " + label);
			}, "failed to delete " + label, {
				"key": d.key
			}, "/_db");
		}, "red"), "div", "right" + (!d.key ? " hidden" : ""));
		n.appendChild(this._delete);
		n.appendChild(CT.dom.button("Submit", this._submit));
		d.key && n.appendChild(CT.admin.db.star(d.key));
	},
	"init": function(model, data) {
		this.modelName = model;
		this.schema = CT.db.getSchema(model);
		this.data = data;
		this.inputs = [];
		this.blobs = [];
		this._table();
	}
});