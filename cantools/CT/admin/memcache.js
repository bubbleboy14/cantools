CT.admin.memcache = {
	"init": function() {
		CT.log("acquiring memcache snapshot");
		CT.admin.core.init("memcache", function(mc) {
			var mck = Object.keys(mc);
			CT.log("acquired memcache object with " + mck.length + " keys");
			if (mck.length)
				CT.panel.simple("mc", mck);
			else
				document.body.appendChild(CT.dom.node("memcache is empty"));
		});
	}
};