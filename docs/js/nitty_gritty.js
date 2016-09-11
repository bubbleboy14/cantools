CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	core.util.buildPage([
		{
			name: "Architecture",
			content: CT.dom.img("/img/architecture.png", "w1")
		},
		{
			name: "Initialization",
			content: [
				CT.dom.node("Installing cantools", "div", "big pv10"),
				"Pop open a terminal and clone cantools:",
				CT.dom.node("~> git clone https://github.com/bubbleboy14/cantools.git", "div", "code"),
				"Install it:",
				CT.dom.node([
					"~> cd cantools",
					"~/cantools> sudo python setup.py install",
					"~/cantools> sudo python setup.py develop",
				], "div", "code"),
				CT.dom.node("Creating A Project", "div", "big pv10"),
				"Then navigate somewhere else and make up a name for your project:",
				CT.dom.node([
					"~/cantools> cd ..",
					"~> ctinit greatprojectname",
				], "div", "code"),
				CT.dom.node("Refreshing A Project", "div", "big pv10"),
				"Maybe you're jumping into someone else's project. That's fine. First, make sure cantools is installed (see above). If you already have it, it doesn't hurt to make sure it's up to date. In your terminal:",
				CT.dom.node("~> ctinit -u", "div", "code"),
				[
					CT.dom.node("That command pulls in the latest cantools, and also updates any managed plugins (more about that", "span"),
					CT.dom.pad(),
					CT.dom.link("here", function() {
						CT.dom.id("tlPlugins").trigger();
					}),
					CT.dom.node("). Now navigate to your project and refresh:", "span")
				],
				CT.dom.node([
					"~> cd someproject",
					"~/someproject> ctinit -r"
				], "div", "code"),
				"That command installs all necessary plugins and adds in all the symlinks that don't belong in a repository."
			]
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
			name: "Configuration",
			content: [
				CT.dom.node("Client", "div", "big bold pv10"),
				"blah blah client",
				CT.dom.node("Server", "div", "big bold pv10"),
				"blah blah server"
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