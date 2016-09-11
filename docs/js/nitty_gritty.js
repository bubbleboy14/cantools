CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	core.util.buildPage([
		{
			name: "Architecture",
			content: CT.dom.img("/img/architecture.png", "w1")
		},
		{
			name: "Object Relational Mapper",
			content: ""
		},
		{
			name: "Routing",
			content: ""
		},
		{
			name: "Request Handling",
			content: ""
		},
		{
			name: "Configuration",
			content: "blah blah configuration"
		},
		{
			name: "Javascript",
			content: [
				CT.dom.node("Modules", "div", "big bold pv10"),
				"blah blah modules",
				CT.dom.node("Classes", "div", "big bold pv10"),
				"blah blah classes",
				CT.dom.node("Compilation Modes", "div", "big bold pv10"),
				"blah blah compilation modes"
			]
		},
		{
			name: "Logging",
			content: [
				CT.dom.node("Client", "div", "big bold pv10"),
				"blah blah client",
				CT.dom.node("Server", "div", "big bold pv10"),
				"blah blah server"
			]
		},
		{
			name: "Caching",
			content: [
				CT.dom.node("Client", "div", "big bold pv10"),
				"blah blah client",
				CT.dom.node("Server", "div", "big bold pv10"),
				"blah blah server"
			]
		},
		{
			name: "Plugins",
			content: [
				CT.dom.node("Using Plugins", "div", "big bold pv10"),
				"blah blah using",
				CT.dom.node("Building Plugins", "div", "big bold pv10"),
				"blah blah building"
			]
		}
	], "ctcontent3", "ctlist3 big");
});