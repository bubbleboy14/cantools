core.config = {
	"header": {
		"centerLogo": false,
		"logo": CT.dom.img("/img/logo.png", "h1"),
		"right": [
			CT.dom.link("code", null, "https://github.com/bubbleboy14/cantools", null, null, null, true),
			CT.dom.pad(4),
			CT.dom.link("plugins", null, "/plugins.html"),
			CT.dom.pad(4),
			CT.dom.link("docs", null, "/docs"),
			CT.dom.pad(4),
			CT.dom.link("nitty gritty", null, "/nitty_gritty.html")
		]
	},
	"footer": {
		"logoClass": "abs b0 l0 hgrow",
		"linksClass": "abs b0 r0 small mosthigh",
		"logo": "cantools",
		"extra": CT.dom.node([
			CT.dom.node(",/\\~~/\\.", "center"),
			CT.dom.node([
				CT.dom.node("(", "span"),
				CT.dom.pad(),
				CT.dom.node([
					CT.dom.node("c", "span", "biggest", null, null, { verticalAlign: "sub" }),
					CT.dom.node("+", "span", "smaller inline-block", null, null, { marginLeft: "-5px" })
				], "div", "inline-block", "lefteye"),
				CT.dom.pad(),
				CT.dom.node([
					CT.dom.node("c", "span", "biggest", null, null, { verticalAlign: "sub" }),
					CT.dom.node("+", "span", "smaller inline-block", null, null, { marginLeft: "-5px" })
				], "div", "inline-block", "righteye"),
				CT.dom.pad(),
				CT.dom.node(")", "span")
			], "center")
		], null, "abs b0 pointer", "winker"),
		"bottom": ["user", "blog", "store", "decide", "coop", "tunes", "docs"].map(function(pname) {
				var p = "ct" + pname;
				return CT.dom.link(p, function() {
					if (location.pathname == "/plugins.html")
						CT.dom.id("tl" + p).trigger();
					else
						window.location = "/plugins.html#" + p;
				}, null, "ph10");
			}),
		"links": [
			{
				content: "MIT License",
				href: "https://github.com/bubbleboy14/cantools/blob/master/LICENSE"
			}
		]
	},
	"css": [],
	"ctdocs": {
		"base": "https://github.com/bubbleboy14/cantools/blob/master/",
		"source": function(name) {
			var base = core.config.ctdocs.base;
			if (name == "about")
				return base + "README.md";
			else if (name == "pubsub")
				return base + "cantools/scripts/pubsub/ps.py";
			else if (name.endsWith(".js"))
				return base + "cantools/CT/" + name;
			else
				return base + "cantools/scripts/" + name + ".py";
		}
	}
};