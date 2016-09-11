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
				CT.dom.node("Installing cantools", "div", "bigger bold pv10"),
				"Pop open a terminal and clone cantools:",
				CT.dom.node("~> git clone https://github.com/bubbleboy14/cantools.git", "div", "code"),
				"Install it:",
				CT.dom.node([
					"~> cd cantools",
					"~/cantools> sudo python setup.py install",
					"~/cantools> sudo python setup.py develop",
				], "div", "code"),
				CT.dom.node("Creating A Project", "div", "bigger bold pv10"),
				"Then navigate somewhere else and make up a name for your project:",
				CT.dom.node([
					"~/cantools> cd ..",
					"~> ctinit greatprojectname",
				], "div", "code"),
				CT.dom.node("Refreshing A Project", "div", "bigger bold pv10"),
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
			content: [
				CT.dom.node("Choosing Your Backend", "div", "bigger bold pv10"),
				[
					CT.dom.node("The cantools abstraction layer is like a rodeo performer riding two horses simultaneously:", "span"),
					CT.dom.pad(),
					CT.dom.link("the GAE neopythonic cloud datastore", null,
						"https://cloud.google.com/appengine/docs/python/ndb/", null, null, null, true),
					CT.dom.node("; and the SQL database of your choice (our recommendation), via", "span"),
					CT.dom.pad(),
					CT.dom.link("sqlalchemy", null, "http://www.sqlalchemy.org/", null, null, null, true),
					CT.dom.node(".", "span")
				],
				CT.dom.node("Modeling Data", "div", "bigger bold pv10"),
				[
					CT.dom.node("Now that you've got a project to mess around with, check out model.py. It will be mostly empty. For a good example of the sorts of things you can type there, feast your eyes on the", "span"),
					CT.dom.pad(),
					CT.dom.link("ctuser", null, "/plugins.html#ctuser"),
					CT.dom.pad(),
					CT.dom.node("plugin's", "span"),
					CT.dom.pad(),
					CT.dom.link("model injections", null,
						"https://github.com/bubbleboy14/ctuser/blob/master/ctuser/model.py"),
					CT.dom.node(". Our sleek api is <b>boilerplateless</b> thanks to the", "span"),
					CT.dom.pad(),
					CT.dom.link("metaclass magic of the model module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/model.py")
				],
				CT.dom.node("Queries", "div", "bigger bold pv10"),
				[
					CT.dom.node("Access Your Data", "div", "big pv10"),
					[
						CT.dom.node("The cantools abstraction layer manages", "span"),
						CT.dom.pad(),
						CT.dom.link("database sessions", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/session.py",
							null, null, null, true),
						CT.dom.pad(),
						CT.dom.node("under the hood, allowing numerous incrementally alternating request -bound sessions, as well as any number of simultaneous long-running thread -bound sessions, to coexist, reading and writing data at will. The session manager is utilized by individual", "span"),
						CT.dom.pad(),
						CT.dom.link("Query", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/query.py",
							null, null, null, true),
						CT.dom.pad(),
						CT.dom.node("instances, which in turn are used by the", "span"),
						CT.dom.pad(),
						CT.dom.link("getters", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/getters.py",
							null, null, null, true),
						CT.dom.node(", which themselves instantiate Query objects with the query() function attached to each data model (as do the", "span"),
						CT.dom.pad(),
						CT.dom.link("setters", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/setters.py",
							null, null, null, true),
						CT.dom.node(").", "span")
					],
					CT.dom.node("Even From Javascript(!)", "div", "big pv10"),
					[
						CT.dom.node("Check out the", "span"),
						CT.dom.pad(),
						CT.dom.link("CT.db", null, "/docs#db.js"),
						CT.dom.pad(),
						CT.dom.node("module to learn all about querying and messing with your data from all the way over in the client. Really!", "span")
					]
				],
				CT.dom.node("Migration", "div", "bigger bold pv10"),
				[
					CT.dom.node("Wherever you choose to squirrel away your data, you'll eventually have to move it somewhere. Check out", "span"),
					CT.dom.pad(),
					CT.dom.link("ctmigrate", null, "/docs#migrate"),
					CT.dom.pad(),
					CT.dom.node("to learn more!", "span")
				]
			]
		},
		{
			name: "Routing",
			content: [
				CT.dom.node("The Basics", "div", "bigger bold pv10"),
				[
					CT.dom.node("All routing is handled in the <b>app.yaml</b> file,", "span"),
					CT.dom.pad(),
					CT.dom.link("YAML", null, "http://yaml.org/", null, null, null, true),
					CT.dom.node("-style. Each rule consists of a <b>url</b>, which may be a regular expression, followed by either a <b>script</b> line or a <b>static_dir</b> line.", "span")
				],
				CT.dom.node("Static Directories", "div", "bigger bold pv10"),
				"A static rule looks like this:",
				CT.dom.node([
					"- url: /css",
					CT.dom.pad(2),
					CT.dom.node("static_dir: css", "span"),
				], "div", "code"),
				CT.dom.node("Web Handlers", "div", "bigger bold pv10"),
				"A dynamic rule looks like this:",
				CT.dom.node([
					"- url: /_db",
					CT.dom.pad(2),
					CT.dom.node("script: _db.py", "span"),
				], "div", "code"),
				CT.dom.node("What's That Stuff At The Bottom?", "div", "bigger bold pv10"),
				"At some point in your <b>app.yaml</b> file, you'll see the following line:",
				CT.dom.node("## MODE SWITCHING -- DON'T MESS WITH (unless you know what you're doing)!",
					"div", "code"),
				[
					CT.dom.node("The stuff after that is used by", "span"),
					CT.dom.pad(),
					CT.dom.link("the compiler", null, "/doc#deploy"),
					CT.dom.pad(),
					CT.dom.node("to switch between compilation modes. Now you know.", "span")
				]
			]
		},
		{
			name: "Request Handling",
			content: ""
		},
		{
			name: "Javascript",
			content: [
				CT.dom.node("Modules", "div", "bigger bold pv10"),
				"blah blah modules",
				CT.dom.node("Classes", "div", "bigger bold pv10"),
				"blah blah classes",
				CT.dom.node("Compilation Modes", "div", "big bold pv10"),
				"blah blah compilation modes"
			]
		},
		{
			name: "Configuration",
			content: [
				CT.dom.node("Client", "div", "bigger bold pv10"),
				"blah blah client",
				CT.dom.node("Server", "div", "bigger bold pv10"),
				"blah blah server"
			]
		},
		{
			name: "Logging",
			content: [
				CT.dom.node("Client", "div", "bigger bold pv10"),
				"blah blah client",
				CT.dom.node("Server", "div", "bigger bold pv10"),
				"blah blah server"
			]
		},
		{
			name: "Caching",
			content: [
				CT.dom.node("Client", "div", "bigger bold pv10"),
				"blah blah client",
				CT.dom.node("Server", "div", "bigger bold pv10"),
				"blah blah server"
			]
		},
		{
			name: "Plugins",
			content: [
				CT.dom.node("Using Plugins", "div", "bigger bold pv10"),
				"blah blah using",
				CT.dom.node("Building Plugins", "div", "bigger bold pv10"),
				"blah blah building"
			]
		},
		{
			name: "Admin Dashboard",
			content: [
				CT.dom.node("db", "div", "bigger bold pv10"),
				"blah blah db",
				CT.dom.node("memcache", "div", "bigger bold pv10"),
				"blah blah memcache",
				CT.dom.node("pubsub", "div", "bigger bold pv10"),
				"blah blah pubsub",
				CT.dom.node("logs", "div", "bigger bold pv10"),
				"blah blah logs"
			]
		}
	], "ctcontent3", "ctlist3 big");
});