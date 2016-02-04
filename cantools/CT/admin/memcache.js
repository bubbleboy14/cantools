CT.admin.memcache = {
	"init": function() {
		CT.log("acquiring memcache snapshot");
		CT.admin.core.init("memcache", function(mc) {
			CT.log("acquired memcache object with " + Object.keys(mc).length + " keys");
			CT.panel.simple("mc", Object.keys(mc));
		});
	}
};