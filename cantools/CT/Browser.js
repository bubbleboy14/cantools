/*
This module contains a generic data browsing interface.
*/

CT.Browser = CT.Class({
	CLASSNAME: "CT.Browser",
	_: {
		nodes: {},
		edit: function(data, noreview) {
			var _ = this._, oz = this.opts, view = this.view;
			CT.db.put(data, function(dfull) {
				if (data.key) {
					oz.saveMessage && alert(oz.saveMessage);
					return noreview || view(dfull);
				}
				_.items.push(dfull);
				_.tlist.postAdd(dfull, true);
			});
		},
		load: function(d) {
			var _ = this._, oz = this.opts, fview = this.firstview;
			if (d.name)
				return this.view(d);
			CT.dom.setContent(_.nodes.content, CT.dom.div([
				CT.dom.div(oz.opener || ("what's this " + oz.modelName + " called?"), "bigger centered"),
				CT.dom.smartField({
					classname: "w1",
					blurs: oz.blurs,
					cb: function(name) {
						d.name = name;
						fview(d);
					}
				})
			], "margined padded bordered round"));
		},
		build: function(items) {
			this.items(items);
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
			var maker = CT.dom.id("tlnew" + oz.modelName),
				h = document.location.hash.slice(1),
				hd = h && CT.data.get(h);
			if (hd && hd.modelName == oz.modelName)
				setTimeout(CT.dom.id("tl" + h).firstChild.onclick, 200); // wait a tick...
			else
				maker.trigger();
			if (oz.filter) {
				CT.dom.setContent(maker.firstChild,
					CT.dom.div("+", "biggest bold shiftup"));
				maker.style.float = "right";
				_.tlist.parentNode.insertBefore(CT.dom.div([
					CT.dom.filter(_.tlist),
					maker
				], "browser_filter"), _.tlist);
			}
		},
		setup: function() {
			var _ = this._, nz = _.nodes, oz = this.opts;
			nz.list = CT.dom.div(null, "ctlist");
			nz.content = CT.dom.div(null, "ctcontent");
			CT.dom.setContent(oz.parent, [
				nz.list,
				nz.content
			]);
			CT.db.get(oz.modelName, oz.prebuild || _.build, null, null, null, oz.owner && {
				owner: user.core.get("key") // requires user module
			});
		}
	},
	namer: function(d, classes) {
		var n = CT.dom.div(d.name,
			"pointer " + (classes || "bigger centered"));
		n.onclick = function() {
			var sf = CT.dom.smartField({
				value: d.name,
				cb: function(name) {
					if (name == d.name) return;
					CT.db.put({
						key: d.key,
						name: name
					}, function(newd) {
						d.name = newd.name;
						d.label = newd.label;
						CT.dom.setContent(n, d.name);
						CT.dom.setContent(CT.dom.id("tl" + d.key).firstChild,
							d.label);
					});
				}
			});
			CT.dom.setContent(n, sf);
			sf.focus();
		};
		return n;
	},
	view: function(d) {
		// override!
		CT.dom.setContent(_.nodes.content, [
			this.namer(d),
			JSON.stringify(d)
		]);
	},
	firstview: function(d) {
		this.view(d);
	},
	defaults: function() {
		// override
	},
	items: function(items) {
		// override
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			parent: "ctmain",
			modelName: null, // REQUIRED
			nopts: {},
			owner: true,
			filter: true,
			blurs: ["name please", "title", "what's it called?"]
		});
		setTimeout(this._.setup);
	}
});