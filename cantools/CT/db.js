/*
This module provides direct integration with the cantools.db backend
via the _db.py request handler. Some key functions are defined below.

### CT.db.getSchema(modelName)
Return the schema for the named model.

### CT.db.setSchema(schema)
Sets CT.db._schema, which includes every model in the database. This is
called automatically by CT.db.init(), which acquires it from the backend.

### CT.db.get(modelName, cb, limit (default: 20), offset (default: 0), order, filters)
Acquire the data set defined by the given query parameters, add
it to CT.data's map, and pass it back via callback function (cb).

### CT.db.multi(keys, cb)
Acquire data objects corresponding to members of 'keys' array, add
them to CT.data's map, and pass them back via callback function (cb).

### CT.db.one(key, cb)
Acquire data object corresponding to 'key' string, add it to
CT.data's map, and pass it back via callback function (cb).

### CT.db.init(opts)
Acquire and set the database schema. Establish CT.db._opts object used by
UI elements for querying database and adding/editing records. These include:

    - builder (required):
      - this generator function, given a modelName, returns a render callback
        for internal use with CT.panel.pager().
    - panel_key (default: 'db'):
      - this optional string argument may be used to indicate the desired parent
        node of a pager element (generated by CT.db.pager()).
    - post_pager (optional):
      - this function is called whenever a pager is generated via CT.db.pager().

### CT.db.query(opts, transition)
This function generates a modal (CT.modal.Modal) containing a query node
(CT.db.Query) constructed with opts. The modal appears onscreen with the
indicated transition (defaults to 'none').

### CT.db.pager(modelName, order, filters, k, cnode)
This function creates a pager node (CT.Pager [via CT.panel.pager()] refilled
via CT.db.get() used in conjunction with modelName, order, filters). It then
adds this node to a parent indicated by cnode or (if undefined) determined by
k (which falls back to modelName) and panel_key (set by CT.db.init(), defaults
to 'db'). Finally, if a 'post_pager' callback has already been defined by
CT.db.init(), this callback is invoked, passing in key and modelName.

### CT.db.edit (submodule)
This submodule contains functions for building interface elements that
enable direct creation and modification of database records. This includes
the CT.db.edit.EntityRow class, of which such interfaces primarily consist.

### CT.db.Query (class)
This class (often used in conjunction with CT.modal.Modal) builds a DOM node
containing the interface elements necessary to define a query against the specified
table. The constructor takes an options object ('opts') with three possible entries:

    - showHelp: indicates whether or not to show help strings in the query node
      - default: false
    - pagerPanelId: specifies parent node for pager generated by default submit
      - default: 'dbqueries'
    - submit: the function to call when the 'submit' button is clicked
      - default: pager node is created and added to parent indicated by pagerPanelId
*/

CT.db = {
	_schema: {},
	_limit: 20,
	_pagerLimit: 20,
	key2model: function(key) {
		if (key.slice(-3, -1) == "CT") {
			var i, num = parseInt(key.slice(-1));
			key = key.slice(0, -3);
			for (i = 0; i < num; i++)
				key += "=";
		}
		return JSON.parse(atob(key)).model;
	},
	key2label: function(key) {
		var d = CT.data.get(key);
		return d.label;
	},
	isKey: function(modelName, property) {
		return !!CT.db._schema[modelName]._kinds[property];
	},
	getSchema: function(modelName) {
		return modelName ? CT.db._schema[modelName] : CT.db._schema;
	},
	setSchema: function(schema) {
		CT.db._schema = schema;
		var s, p, ref, rmap = CT.db._rmap = {};
		for (s in schema) {
			for (p in schema[s]._kinds) {
				ref = s + "." + p;
				schema[s]._kinds[p].forEach(function(k) {
					if (! (k in rmap) )
						rmap[k] = [];
					rmap[k].push(ref);
				});
			}
		}
	},
	setLimit: function(limit) {
		CT.db._limit = limit;
	},
	setPagerLimit: function(limit) {
		CT.db._pagerLimit = limit;
	},
	eachProp: function(modname, cb) {
		return Object.keys(CT.db._schema[modname]).filter(function(p) {
			return ["index", "key", "modelName", "label", "_label", "_kinds"].indexOf(p) == -1;
		}).map(function(k) {
			return cb(k);
		});
	},
	reference2label: function(modelName, property) {
		var t = CT.db._schema[modelName]._kinds[property][0];
		return {
			modelName: t,
			property: CT.db._schema[t]._label
		};
	},
	get: function(modelName, cb, limit, offset, order, filters, sync) {
		var f, v, qdata = {
			"action": "get",
			"modelName": modelName,
			"limit": limit || CT.db._limit,
			"offset": offset || 0
		};
		if (order)
			qdata.order = order;
		if (filters) {
			for (f in filters) {
				v = filters[f];
				if (!v.comparator) {
					filters[f] = {
						value: v,
						comparator: "=="
					};
				}
			}
			qdata.filters = filters;
		}
		return CT.net.post("/_db", qdata, null, function(d) {
			CT.data.addSet(d);
			cb(d);
		}, null, null, null, null, sync);
	},
	multi: function(keys, cb) {
		var needed = keys.filter(function(k) {
			return !CT.data.get(k);
		});
		if (!needed.length) {
			return cb(keys.map(function(k) {
				return CT.data.get(k);
			}));
		}
		CT.net.post("/_db", {
			action: "get",
			keys: needed
		}, null, function(dlist) {
			CT.data.addSet(dlist);
			cb && cb(keys.map(function(k) {
				return CT.data.get(k);
			}));
		});
	},
	one: function(key, cb) {
		if (CT.data.has(key))
			return cb && cb(CT.data.get(key));
		CT.net.post("/_db", {
			action: "get",
			key: key
		}, null, function(d) {
			CT.data.add(d);
			cb && cb(d);
		});
	},
	withSchema: function(cb) {
		if (Object.keys(CT.db._schema).length)
			cb && cb(CT.db._schema);
		else
			CT.net.post("/_db", { "action": "schema" }, null, function(schema) {
				CT.db.setSchema(schema);
				cb && cb(schema);
			});
	},
	init: function(opts) { // this stuf maybe shouldn't be here ... more like admin.db?
		CT.db._opts = opts = CT.merge(opts, {
			panel_key: "db", // required: builder(). also why not: post_pager
		});
		CT.db.withSchema(opts.cb);
	},
	query: function(opts, transition) {
		(new CT.modal.Modal({
			"node": (new CT.db.Query(opts)).node,
			"transition": transition || "none"
		})).show();
	},
	_refill: function(modelName, order, filters) {
		return function(obj, cb) {
			CT.db.get(modelName, cb, obj.limit, obj.offset, order, filters);
		};
	},
	pager: function(modelName, order, filters, k, cnode) {
		var o = CT.db._opts, key = k || modelName,
			cnode = cnode || CT.dom.id(o.panel_key + "content" + key);
		cnode.appendChild(CT.panel.pager(o.builder(modelName),
			CT.db._refill(modelName, order, filters),
			CT.db._pagerLimit, "rcol", "data", key));
		o.post_pager && o.post_pager(key, modelName);
	}
};

CT.db.Blob = CT.Class({
	CLASSNAME: "CT.db.Blob",
	uploadPrompt: function() {
		(new CT.modal.Prompt({
			noClose: true,
			style: "file",
			transition: "slide",
			cb: this.upload
		})).show();
	},
	upload: function(ctfile) {
		var params = { action: "blob" };
		if (this.index)
			params.value = this.index;
		else {
			params.key = this.opts.key;
			params.property = this.opts.property;
		}
		ctfile.upload("/_db", this._update, params);
	},
	_update: function(val) {
		this.opts.value = val;
		this.opts.cb && this.opts.cb(val);
		this._setup();
	},
	_setup: function() {
		if (this.opts.value) {
			this.index = this.opts.value.slice(6);
			CT.dom.setContent(this.node, [
				CT.dom.link("download", null,
					"/_db?action=blob&value=" + this.index,
					this.opts.className || "blue", null, null, true),
				CT.dom.pad(),
				CT.dom.link("upload", this.uploadPrompt, null, this.opts.className || "nodecoration blue")
			]);
		} else if (this.opts.key)
			CT.dom.setContent(this.node, CT.dom.link(this.opts.firstUp || "upload",
				this.uploadPrompt, null, this.opts.className || "nodecoration blue"));
		else if (!this.opts.noNothing)
			CT.dom.setContent(this.node, "(nothing yet)");
	},
	value: function() {
		return this.index;
	},
	keyUp: function(key) {
		this.opts.key = key;
		this._setup();
	},
	init: function(opts) {
		this.opts = opts;
		this.node = CT.dom.node();
		this.node.blob = this;
		this._setup();
	}
});

CT.db.edit = {
	_d: { // unimplemented: list -- no editing (yet) :)
		"string": "",
		"text": "",
		"integer": 0,
		"float": 0.0,
		"boolean": false,
		"datetime": null,
		"key": null,
		"blob": null,
		"list": [],
		"keylist": []
	},
	_no_ent: {
		"key": null,
		"label": "(tap to select)"
	},
	propertyDefault: function(ptype) {
		return CT.db.edit._d[ptype];
	},
	isSupported: function(ptype, key) {
		if (key == "label" || key == "_label")
			return false;
		// implement list editing soon!!
		return ptype in CT.db.edit._d;
	},
	getDefaults: function(modelName, extras) {
		var k, d = extras || {},
			schema = CT.db._schema[modelName];
		for (k in schema)
			d[k] = CT.db.edit._d[schema[k]];
		return d;
	},
	_val: function(f, ptype) {
		return function() {
			if (ptype == "boolean")
				return f.isChecked ? f.isChecked() : f.checked;
			if (ptype == "integer")
				return parseInt(f.value) || null;
			if (ptype == "float")
				return parseFloat(f.value) || null;
			if (ptype == "key")
				return f.data.key;
			if (["datetime", "list", "keylist"].indexOf(ptype) != -1)
				return typeof f.value == "string" ? f.value : f.value();
			return f.value; // string/text/list/keylist
		};
	},
	input: function(k, ptype, val, modelName, opts) {
		var valcell, lstyle = { marginLeft: "180px", minHeight: "18px" };
		opts = opts || {};
		if (ptype == "string")
			valcell = CT.dom.field(null, val);
		else if (ptype == "text")
			valcell = CT.dom.textArea(null, val);
		else if (ptype == "boolean") {
			if (opts.label)
				valcell = CT.dom.checkboxAndLabel(k, val);
			else {
				valcell = CT.dom.checkbox(null, val, {
					"display": "inline-block",
					"width": "160px"
				});
			}
		} else if (ptype == "float")
			valcell = CT.parse.numOnly(CT.dom.field(null, val), true);
		else if (ptype == "integer")
			valcell = CT.parse.numOnly(CT.dom.field(null, val));
		else if (ptype == "key")
			valcell = (new CT.db.edit.EntityRow({
				property: k,
				key: val,
				modelName: modelName
			})).node;
		else if (ptype == "datetime")
			valcell = CT.dom.dateSelectors(null, null, opts.startYear, null, true, null, val);
		else if (ptype == "blob") {
			var bopts = {
				key: opts.key,
				property: k,
				value: val
			};
			if (opts.label)
				bopts.firstUp = "upload " + k;
			valcell = (new CT.db.Blob(bopts)).node;
		}
		else if (ptype == "list") {
			if (val)
				valcell = CT.dom.fieldList(val, null, lstyle);
			else
				valcell = CT.dom.field();
		} else if (ptype == "keylist") {
			if (val)
				valcell = CT.dom.fieldList(val, function(v) {
					return (new CT.db.edit.EntityRow({
						property: k,
						key: v,
						modelName: modelName
					})).node;
				}, lstyle);
			else
				valcell = (new CT.db.edit.EntityRow({
					property: k,
					modelName: modelName
				})).node;
		}
		if (opts.label && ptype == "string" || ptype == "text")
			CT.dom.blurField(valcell, [k]);
		valcell.getValue = CT.db.edit._val(valcell, ptype);
		valcell.rowKey = k;
		return valcell;
	},
	media: function(opts) {
		opts = CT.merge(opts, {
			className: "w1",
			parentClass: "w1",
			mediaType: "img" // or video
		});
		opts.property = opts.property || opts.mediaType;
		var n = CT.dom.node(null, "div", opts.parentClass),
			val = opts.data[opts.property],
			uptype = opts.mediaType == "img" ? "image" : "video",
			media = CT.dom[opts.mediaType](val, opts.className),
			blob = new CT.db.Blob({
				noNothing: true,
				key: opts.data.key,
				property: opts.property,
				value: val,
				firstUp: "upload " + uptype,
				className: "round hoverglow",
				cb: function(newVal) {
					media.src = newVal + "?ts=" + Date.now();
					opts.data[opts.property] = newVal;
					opts.cb && opts.cb();
				}
			});
		CT.dom.setContent(n, [media, blob.node]);
		return n;
	},
	img: function(opts) {
		CT.log("[DEPRECATION WARNING] CT.db.edit.img() is deprecated. Use CT.db.edit.media() instead.");
		return CT.db.edit.media(opts);
	}
};

CT.db.edit.EntityRow = CT.Class({
	CLASSNAME: "CT.db.edit.EntityRow",
	mtable: function() {
		var k, s = CT.dom.node("", "div", "h9-10 scroller"), n = CT.dom.node(s, "div", "h1");
		for (k in this.node.data)
			s.appendChild(CT.dom.node([
				CT.dom.node(k + ":", "div", "keycell"),
				CT.dom.node(this.node.data[k] || "(none)", "span")
			], "div", "lister"));
		n.appendChild(CT.dom.button("change", this.change));
		CT.admin && n.appendChild(CT.dom.button("edit", this.edit));
		return n;
	},
	edit: function() {
		CT.admin.db.starLink(this.node.data).onclick();
		this._modal.hide();
	},
	modal: function() {
		this._change && this._change.hide();
		this._modal = this._modal || new CT.modal.Modal({
			transition: "fade",
			className: "basicpopup h3-5",
			node: this.mtable()
		});
		this._modal.show();
	},
	change: function() {
		this._modal && this._modal.hide();
		this._change = this._change || new CT.modal.Prompt({
			transition: "slide",
			prompt: "enter name of new " + this.opts.property,
			cb: this.node.fill,
			autocomplete: CT.db.reference2label(this.opts.modelName, this.opts.property)
		});
		this._change.show();
	},
	_change_or_modal: function() {
		if (this.opts.key)
			this.modal();
		else
			this.change();
	},
	init: function(opts) {
		this.opts = opts;
		var vdata = CT.data.get(opts.key),
			n = this.node = CT.dom.node(CT.dom.link(null, this._change_or_modal), "span");
		n.fill = function(d) {
			d = n.data = d || CT.db.edit._no_ent;
			n.value = d.key;
			opts.key = d.key;
			CT.dom.setContent(n.firstChild, d.label);
		};
		if (vdata || !opts.key)
			n.fill(vdata);
		else
			CT.db.one(opts.key, function(d) {
				CT.data.add(d);
				n.fill(d);
			});
	}
});

CT.db.Query = CT.Class({
	CLASSNAME: "CT.db.Query",
	_filter: function() {
		var valcell = CT.dom.node(null, "span"), that = this,
			compcell = CT.dom.node(null, "span"),
			selectcell = CT.dom.select(this.filterables, null, null, null, null, function() {
				var val = that.schema[selectcell.value];
				CT.dom.setContent(compcell, val.slice(-4) == "list" ?
					CT.dom.select(["contains", "lacks"]) :
					CT.dom.select(["==", ">", "<", ">=", "<=", "!=", "like"]))
				CT.dom.setContent(valcell,
					CT.db.edit.input(selectcell.value, val,
						null, that.modelName, that.opts));
			}), rmcell = CT.dom.button("remove", function() {
				CT.dom.remove(selectcell.parentNode);
			});
		selectcell.onchange();
		this.filters.appendChild(CT.dom.node([selectcell, compcell, valcell, rmcell]));
	},
	_suborders: function() {
		var mod = this.modelName, subs = [];
		CT.db._rmap[mod].forEach(function(sub) {
			subs.push(sub);
			CT.db._rmap[sub.split(".")[0]].forEach(function(subsub) {
				subs.push(subsub + "." + mod);
			});
		});
		return subs;
	},
	_order: function() {
		var selectcell = CT.dom.select(["None"].concat(this.filterables).concat(this._suborders())),
			dircell = CT.dom.select(["ascending", "descending"]);
		dircell.className = "hidden";
		selectcell.onchange = function() {
			if (selectcell.value == "None")
				dircell.classList.add("hidden");
			else
				dircell.classList.remove("hidden");
		};
		return CT.dom.node([selectcell, dircell]);
	},
	_submit: function() {
		var order = null, filters = {}, osel = this.order.firstChild;
		if (osel.value != "None")
			order = osel.nextSibling.value == "descending"
				? "-" + osel.value : osel.value;
		CT.dom.each(this.filters, function(fnode) {
			var propcell = fnode.firstChild,
				compcell = propcell.nextSibling,
				valcell = compcell.nextSibling;
			filters[propcell.value] = {
				comparator: compcell.firstChild.value,
				value: valcell.firstChild.getValue()
			};
		});
		this.opts.submit({
			modelName: this.modelName,
			order: order,
			filters: filters
		});
		this.node.parentNode.parentNode.modal.hide();
	},
	_submitCb: function(opts) {
		var key = this.modelName + "query" + this.id;
		CT.panel.add(this.modelName + " (" + this.id + ")",
			false, "db", CT.dom.id(this.opts.pagerPanelId), null, key);
		CT.db.pager(this.modelName, opts.order, opts.filters, key);
		CT.panel.swap(key, false, "db");
	},
	_build: function() {
		this.filters = CT.dom.node();
		this.order = this._order();
		this.node = CT.dom.node([
			CT.dom.node("Query: " + this.modelName, "div", "bigger bold"),
			CT.dom.node("Order", "div", "big bold"),
			this.order,
			CT.dom.node([
				CT.dom.node("Filters", "span", "big bold"),
				CT.dom.button("add", this._filter)
			]),
			CT.dom.node("Select 'like' comparator for values such as 'MO%' (meaning 'starts with MO')",
				"div", this.opts.showHelp && "italic" || "hidden"),
			this.filters,
			CT.dom.button("submit", this._submit)
		], "div", "centered");
	},
	_filterables: function() {
		this.filterables = [];
		for (var k in this.schema)
			if (CT.db.edit.isSupported(this.schema[k], k))
				this.filterables.push(k);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			submit: this._submitCb,
			pagerPanelId: "dbqueries"
		});
		this.id = CT.db.Query._id;
		CT.db.Query._id += 1;
		this.modelName = opts.modelName;
		this.schema = CT.db.getSchema(opts.modelName);
		this._filterables();
		this._build();
	}
});
CT.db.Query._id = 0;
