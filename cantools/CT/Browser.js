/*
This module contains a generic data browsing interface.
*/

CT.Browser = CT.Class({
	CLASSNAME: "CT.Browser",
	_: {
		edit: function(data, cb, action, pname) {
			var params = {
				action: action || "edit",
				pw: core.config.keys.storage
			};
			params[pname || "data"] = data;
			CT.net.post({
				path: "/_db",
				params: params,
				cb: cb
			});
		},
		load: function(d) {
			var _ = this._, oz = this.opts, view = this.view;
			if (d.name)
				return view(d);
			CT.dom.setContent(_.content, CT.dom.div([
				CT.dom.div("what's this " + oz.modelName + " called?", "bigger centered"),
				CT.dom.smartField({
					classname: "w1",
					blurs: oz.blurs,
					cb: function(name) {
						d.name = name;
						view(d);
					}
				})
			], "margined padded bordered round"));
		},
		build: function(docs) {
			var _ = this._, oz = this.opts,
				defz = this.defaults, ntxt = "new " + oz.modelName;
			_.tlist = CT.panel.triggerList([ntxt].concat(docs), function(d) {
				_.load((d == ntxt) ? CT.merge({
					modelName: oz.modelName,
					owner: user.core.get("key")
				}, defz()) : d);
			});
			CT.dom.setContent(_.list, _.tlist);
			CT.dom.id("tlnew" + oz.modelName).trigger();
		},
		setup: function() {
			var _ = this._, oz = this.opts;
			_.list = CT.dom.div(null, "ctlist");
			_.content = CT.dom.div(null, "ctcontent");
			CT.dom.setContent(oz.parent, [
				_.list,
				_.content
			]);
			CT.db.get(oz.modelName, _.build, null, null, null, {
				owner: user.core.get("key") // requires user module
			});
		}
	},
	view: function(d) {
		// override!
		CT.dom.setContent(_.content, JSON.stringify(d));
	},
	defaults: function() {
		// override
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			parent: "ctmain",
			modelName: null, // REQUIRED
			nopts: {},
			blurs: ["name please", "title", "what's it called?"]
		});
		setTimeout(this._.setup);
	}
});