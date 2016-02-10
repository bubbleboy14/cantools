CT.admin.pubsub = {
	"onsnapshot": function(d) {
		CT.log("got snapshot!");
		["bots", "users", "admins", "channels"].forEach(function(s) {
			CT.log("found " + Object.keys(d[s]).length + " " + s);
		});
	},
	"init": function() {
		CT.log("acquiring pubsub location");
		CT.admin.core.init("pubsub", function(loc) {
			CT.log("acquired location: " + loc.host + ":" + loc.port);
			CT.pubsub.set_cb("snapshot", CT.admin.pubsub.onsnapshot);
			CT.pubsub.connect(loc.host, loc.port,
				"__admin__" + Math.floor(Math.random() * 1000) + btoa(CT.admin.core.pw));
		});
	}
};
