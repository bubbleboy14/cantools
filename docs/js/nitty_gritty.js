CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	core.util.buildPage([
		{
			name: "Architecture",
			content: ""
		},
		{
			name: "Object Relational Mapper",
			content: ""
		},
		{
			name: "Request Handling",
			content: ""
		},
		{
			name: "Configuration",
			content: [
				CT.dom.node("General (ct.cfg)", "div", "big bold pv10"),
				"blah blah general",
				CT.dom.node("Routing (app.yaml)", "div", "big bold pv10"),
				"blah blah routing"
			]
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