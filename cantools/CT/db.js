CT.db = {
	_schema: {},
	"key2model": function(key) {
		return JSON.parse(atob(key)).model;
	},
	getSchema: function(modelName) {
		return modelName ? CT.db._schema[modelName] : CT.db._schema;
	},
	setSchema: function(schema) {
		CT.db._schema = schema;
	},
	get: function(modelName, cb, limit, offset, order, filters) {
		var qdata = {
			"action": "get",
			"modelName": modelName,
			"limit": limit || 20,
			"offset": offset || 0
		};
		if (order)
			qdata.order = order;
		if (filters)
			qdata.filters = filters;
		CT.net.post("/_db", qdata, null, cb);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			panel_key: "db", // required: builder(). also why not: post_pager
		});
		CT.net.post("/_db", { "action": "schema" }, null, function(schema) {
			CT.db.setSchema(schema);
			opts.cb(schema);
		});
	},
	query: function(modelName) {
		(new CT.modal.Modal({
			"node": (new CT.db.Query(modelName)).node
		})).show();
	},
	_refill: function(modelName, order, filters) {
		return function(obj, cb) {
			CT.db.get(modelName, cb, obj.limit, obj.offset, order, filters);
		};
	},
	pager: function(modelName, order, filters, k, pnode, cnode) {
		var o = this.opts, key = k || modelName,
			cnode = cnode || CT.dom.id(o.panel_key + "content" + key);
		cnode.appendChild(CT.panel.pager(o.builder(modelName),
			CT.db._refill(modelName, order, filters), 10, "rcol", "data", key));
		o.post_pager && o.post_pager(key, modelName);
	}
};

CT.db.edit = {
	_d: { // unimplemented: datetimeautostamper, list -- no editing (yet) :)
		"string": "",
		"integer": 0,
		"float": 0.0,
		"boolean": false,
		"key": null
	},
	propertyDefault: function(ptype) {
		return CT.db.edit._d[ptype];
	},
	isSupported: function(ptype) {
		// implement key/datetimeautostamper/list editing soon!!
		return ptype != "key" && ptype in CT.db.edit._d;
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
				return f.checked;
			if (ptype == "integer")
				return parseInt(f.value);
			if (ptype == "float")
				return parseFloat(f.value);
			return f.value; // string
		};
	},
	input: function(k, ptype, val) {
		var valcell;
		if (ptype == "string")
			valcell = CT.dom.field(null, val);
		else if (ptype == "boolean")
			valcell = CT.dom.checkbox(null, val, {
				"display": "inline-block",
				"width": "160px"
			});
		else if (ptype == "float")
			valcell = CT.parse.numOnly(CT.dom.field(null, val), true);
		else if (ptype == "integer")
			valcell = CT.parse.numOnly(CT.dom.field(null, val));
		valcell.getValue = CT.db.edit._val(valcell, ptype);
		valcell.rowKey = k;
		return valcell;
	},
};

CT.db.Query = CT.Class({
	CLASSNAME: "CT.db.Query",
	_filter: function() {
		var valcell = CT.dom.node(null, "span"), schema = this.schema,
			selectcell = CT.dom.select(this.filterables),
			rmcell = CT.dom.button("remove", function() {
				CT.dom.remove(selectcell.parentNode);
			});
		selectcell.onchange = function() {
			CT.dom.setContent(valcell,
				CT.db.edit.input(selectcell.value, schema[selectcell.value]));
		};
		selectcell.onchange();
		this.filters.appendChild(CT.dom.node([selectcell, valcell, rmcell]));
	},
	_order: function() {
		var selectcell = CT.dom.select(["None"].concat(this.filterables)),
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
		var order = null, filters = [], osel = this.order.firstChild;
		if (osel.value != "None")
			order = osel.nextSibling.value == "descending"
				? "-" + osel.value : osel.value;
		CT.dom.each(this.filters, function(fnode) {
			var fc = fnode.firstChild;
			filters.push([fc.value, fc.nextSibling.firstChild.getValue()]);
		});
		var key = this.modelName + "query" + this.id;
		CT.panel.add(this.modelName + " (" + this.id + ")",
			false, "db", CT.dom.id("dbqueries"), null, key);
		CT.db.pager(this.modelName, order, filters, key);
		CT.panel.swap(key, false, "db");
		this.node.parentNode.modal.hide();
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
			this.filters,
			CT.dom.button("submit", this._submit)
		]);
	},
	_filterables: function() {
		this.filterables = [];
		for (var k in this.schema)
			if (CT.db.edit.isSupported(this.schema[k]))
				this.filterables.push(k);
	},
	init: function(modelName) {
		this.id = CT.db.Query._id;
		CT.db.Query._id += 1;
		this.modelName = modelName;
		this.schema = CT.db.getSchema(modelName);
		this._filterables();
		this._build();
	}
});
CT.db.Query._id = 0;
