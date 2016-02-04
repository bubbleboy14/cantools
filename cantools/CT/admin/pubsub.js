CT.admin.pubsub = {
	"init": function() {
		CT.log("acquiring pubsub location");
		CT.admin.core.init("pubsub", function(loc) {
			CT.log("acquired location: " + loc.host + ":" + loc.port);
			CT.pubsub.connect(loc.host, loc.port, "__admin__");
		});
	}
};
