/*
This module contains a generic data browsing interface.
*/

CT.Browser = CT.Class({
	CLASSNAME: "CT.Browser",
	_: {
		nodes: {},
		edit: function(data) {
			var _ = this._, view = this.view;
			CT.db.put(data, function(dfull) {
				if (data.key)
					return view(dfull);
				_.items.push(dfull);
				_.tlist.postAdd(dfull, true);
			});
		},
		load: function(d) {
			var _ = this._, oz = this.opts, view = this.view;
			if (d.name)
				return view(d);
			CT.dom.setContent(_.nodes.content, CT.dom.div([
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
		build: function(items) {
			var _ = this._, oz = this.opts, defs = {
					modelName: oz.modelName
				}, defz = this.defaults, ntxt = "new " + oz.modelName;
			if (oz.owner)
				defs.owner = user.core.get("key");
			_.items = items;
			_.tlist = CT.panel.triggerList([ntxt].concat(items), function(d) {
				_.load((d == ntxt) ? CT.merge(defs, defz()) : d);
			});
			CT.dom.setContent(_.nodes.list, _.tlist);
			CT.dom.id("tlnew" + oz.modelName).trigger();
		},
		setup: function() {
			var _ = this._, nz = _.nodes, oz = this.opts;
			nz.list = CT.dom.div(null, "ctlist");
			nz.content = CT.dom.div(null, "ctcontent");
			CT.dom.setContent(oz.parent, [
				nz.list,
				nz.content
			]);
			CT.db.get(oz.modelName, _.build, null, null, null, oz.owner && {
				owner: user.core.get("key") // requires user module
			});
		}
	},
	view: function(d) {
		// override!
		CT.dom.setContent(_.nodes.content, JSON.stringify(d));
	},
	defaults: function() {
		// override
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			parent: "ctmain",
			modelName: null, // REQUIRED
			nopts: {},
			owner: true,
			blurs: ["name please", "title", "what's it called?"]
		});
		setTimeout(this._.setup);
	}
});