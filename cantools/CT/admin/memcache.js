CT.admin.memcache = {
	"init": function() {
		CT.log("acquiring memcache snapshot");
		CT.admin.core.init("memcache", function(mc) {
			var mck = Object.keys(mc);
			CT.log("acquired memcache object with " + mck.length + " keys");
			if (mck.length) {
				CT.panel.simple(mck, "mc");
				mck.forEach(function(key) {
					CT.dom.setContent("mcpanel" + key, JSON.stringify(mc[key]));
				});
				CT.dom.id("mcinfo").appendChild(CT.dom.node([
					CT.dom.node([
						CT.dom.node("# Entries", "div", "big"),
						CT.dom.node(mck.length)
					], "div", "gbp"),
					CT.dom.node([
						CT.dom.node("Total Size", "div", "big"),
						CT.dom.node(JSON.stringify(mc).length)
					], "div", "gbp"),
					CT.dom.button("Clear", function() {
						CT.admin.core.q("mcclear", function() {
							CT.dom.id("mcitems").innerHTML = "";
							CT.dom.id("mcpanels").innerHTML = "";
							CT.dom.id("mcinfo").innerHTML = "";
							alert("Great, you did it.");
						});
					})
				]));
			} else
				document.body.appendChild(CT.dom.node("memcache is empty"));
		});
	}
};