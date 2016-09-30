CT.admin.pubsub = {
	"onsnapshot": function(d) {
		["bots", "users", "admins", "channels"].forEach(function(s) {
			CT.log("found " + d[s].length + " " + s);
		});
		CT.panel.simple(d.channels.map(function(c) { return c.name; }), "ps");
		CT.admin.pubsub.chans = {};
		d.channels.forEach(function(c) {
			var content = CT.dom.id("pscontent" + c.name),
				nodes = CT.admin.pubsub.chans[c.name] = {
					presence: CT.dom.div(c.users.map(function(u) {
						return CT.dom.div(u, null, (c.name + u).replace(/ /g, ""));
					}), "rcol"),
					messages: CT.dom.div(null, "data")
				};
			content.appendChild(nodes.presence);
			content.appendChild(nodes.messages);
		});
	},
	"onmessage": function(data) {
		CT.admin.pubsub.chans[data.channel].messages.appendChild(CT.dom.node("<b>" + data.user + "</b>: " + JSON.stringify(data.message)));
	},
	"onjoin": function(channel, user) {
		CT.admin.pubsub.chans[channel].presence.appendChild(CT.dom.div(user,
			null, (channel + user).replace(/ /g, "")));
	},
	"onleave": function(channel, user) {
		CT.dom.remove((channel + user).replace(/ /g, ""));
	},
	"init": function() {
		CT.admin.core.init("pubsub", function(loc) {
			CT.pubsub.set_cb("message", CT.admin.pubsub.onmessage);
			CT.pubsub.set_cb("join", CT.admin.pubsub.onjoin);
			CT.pubsub.set_cb("leave", CT.admin.pubsub.onleave);
			CT.pubsub.set_cb("snapshot", CT.admin.pubsub.onsnapshot);
			CT.pubsub.connect(loc.host, loc.port,
				"__admin__" + Math.floor(Math.random() * 1000) + btoa(CT.admin.core._pw));
		});
	}
};
