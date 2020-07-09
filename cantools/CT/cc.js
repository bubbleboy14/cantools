/*
This module supports carecoin integration. Main ingredients:

### CT.cc.view(content)
Notify compensation platform of content view.

### CT.cc.Switcher
Class for generating interface elements for associating a
user with a carecoin membership.
*/

var ccfg = core.config.CC;
if (ccfg && ccfg.agent)
	CT.scriptImport(ccfg.gateway);

CT.cc = {
	_: {
		view: function(cont) {
			var _ = CT.cc._;
			_.viewer = _.viewer || CC.viewer();
			_.viewer.view({
				agent: ccfg.agent,
				content: cont
			});
		},
		oz2mz: function(oz) {
			return oz.filter(o => o.cc.membership).map(o => o.cc.membership);
		}
	},
	view: function(content) {
		var _ = CT.cc._, name = content.title || content.name || content.label,
			identifier = (content.mtype || content.modelName) + ": " + name,
			ukey = content.uid || content.user || content.owner,
			author = ukey && CT.data.get(ukey),
			memship = author && author.cc.membership, cont = {
				identifier: identifier
			};
		CT.log("viewing: " + identifier);
		if (memship) {
			cont.membership = memship;
			_.view(cont);
		} else if (content.owners && content.owners.length) {
			CT.db.multi(content.owners, function(ownz) {
				cont.memberships = _.oz2mz(ownz);
				if (cont.memberships.length)
					_.view(cont);
			});
		} else
			return CT.log("(no mem)");
	},
	views: function(contents) { // expects owner or owners[]
		var _ = CT.cc._, oz = [], cz = [], cont, mz;
		contents.forEach(function(c) {
			oz = oz.concat(c.owners || [c.owner]);
		});
		CT.db.multi(oz, function() {
			contents.forEach(function(c) {
				cont = {
					identifier: c.identifier || (c.modelName + ": " + (c.name || c.title || c.label))
				};
				if (c.owners) {
					mz = _.oz2mz(c.owners.map(CT.data.get));
					if (mz.length)
						cont.memberships = mz;
				} else if (c.owner)
					cont.membership = CT.data.get(c.owner).cc.membership;
				if (cont.membership || cont.memberships)
					cz.push(cont);
			});
			_.view(cz);
		});
	}
};

CT.cc.Switcher = CT.Class({
	CLASSNAME: "CT.cc.Switcher",
	_: {
		isDiff: function(ccdude) {
			var uccfg = this.opts.user.cc,
				cur = uccfg && uccfg.person;
			return ccdude != cur;
		},
		shouldSwitch: function(ccdude) {
			return this._.isDiff(ccdude) && confirm("update your associated carecoin account?");
		},
		userup: function(upd) { // default! override w/ opts.up() if custom (non- user module)
			CT.net.post({
				path: "/_user",
				params: {
					action: "edit",
					user: user.core.get("key"),
					changes: upd
				}
			});
			user.core.update(upd);
		},
		up: function(cc) {
			(this.opts.up || this._.userup)({ cc: cc });
			this.opts.user.cc = cc;
			this._.setSwitcher();
		},
		switched: function(data) {
			var _ = this._, ccdata = data.data;
			if (data.action == "switch") {
				CT.log("you are now " + (ccdata || "no one"));
				if (_.shouldSwitch(ccdata)) {
					if (ccdata) {
						_.ccdude = ccdata;
						_.switcher.enroll({
							agent: ccfg.agent,
							pod: ccfg.pod
						});
					} else
						_.up();
				}
			} else if (data.action == "enrollment") {
				_.up({
					person: _.ccdude,
					membership: ccdata
				});
			}
		},
		setSwitcher: function(switchIt) {
			var _ = this._, uccfg = this.opts.user.cc,
				p = uccfg && uccfg.person;
			if (switchIt) {
				CT.dom.clear(_.switcheroo);
				_.switcher = CC.switcher(_.switcheroo, _.switched);
			} else {
				CT.dom.setContent(_.switcheroo, CT.dom.div([
					"Associated carecoin Account: " + (p || "none"),
					CT.dom.button("switch it up", function() {
						_.setSwitcher(true);
					})
				], "biggerest bigpadded down20"));
			}
		}
	},
	init: function(opts) {
		opts = this.opts = CT.merge(opts, {
			node: "ctmain" // also: user (user mod fallback); up() (userup() fallback)
		});
		if (!opts.user)
			opts.user = user.core.get(); // requires user module!!!
		var _ = this._;
		_.switcheroo = CT.dom.div(null, "h1 centered");
		_.setSwitcher();
		CT.dom.setContent(opts.node, CT.dom.div([
			CT.dom.div("Your <b>carecoin</b> Membership", "bigger centered"),
			CT.dom.div(_.switcheroo, "h170p p0 noflow")
		], "bordered padded margined round"));
	}
});