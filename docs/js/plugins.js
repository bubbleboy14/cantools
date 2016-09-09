CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	CT.initCore();
	var content = CT.dom.node(null, null, "ctcontent"),
		clist = CT.dom.node(null, null, "ctlist bigger"),
		builder = function(data) {
			CT.dom.setContent(content, data.content);
		};
	clist.appendChild(CT.panel.triggerList([
		{
			name: "<i>plugins</i>",
			content: "We've got some plugins, ladies and gentlemen. Click away."
		}, {
			name: "ctuser",
			content: [
				"This package includes a model, a request handler, and frontend components, including a profile page and a browsing interface, for handling user accounts.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctuser", "biggest p30 right")
			]
		}, {
			name: "ctblog",
			content: [
				"This package contains a generic blog-type website.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctblog", "biggest p30 right")
			]
		}, {
			name: "ctstore",
			content: [
				"This package enables the developer to create a basic ecommerce website with nothing but configuration.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctstore", "biggest p30 right")
			]
		}, {
			name: "ctdecide",
			content: [
				"This package provides a framework for group decision making.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctdecide", "biggest p30 right")
			]
		}, {
			name: "ctcoop",
			content: [
				"This package provides organizational management tools (in the form of web pages and components) for a cooperative.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctcoop", "biggest p30 right")
			]
		}, {
			name: "ctunes",
			content: [
				"This package contains a generic music website.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctunes", "biggest p30 right")
			]
		}, {
			name: "ctdocs",
			content: [
				"This package parses JSON-defined documentation data and displays it in a web page.",
				CT.dom.link("Code", null, "https://github.com/bubbleboy14/ctdocs", "biggest p30 right")
			]
		}
	], builder));
	CT.dom.setContent("ctmain", [content, clist]);
	var hash = location.hash.slice(1);
	if (hash)
		CT.dom.id("tl" + hash).trigger();
	else
		CT.dom.className("tlitem")[0].trigger();
});