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
	_: {},
	view: function(content) {
		var _ = CT.cc._, name = content.title || content.name || content.label,
			identifier = (content.mtype || content.modelName) + ": " + name,
			author = CT.data.get(content.uid || content.user || content.owner),
			memship = author && author.cc.membership;
		CT.log("viewing: " + identifier);
		if (!memship) return CT.log("(no mem)");
		_.viewer = _.viewer || CC.viewer();
		_.viewer.view({
			agent: ccfg.agent,
			content: {
				membership: memship,
				identifier: identifier
			}
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