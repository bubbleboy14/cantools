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
					CT.dom.node("-style (parsed", "span"),
					CT.dom.pad(),
					CT.dom.link("here", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/routes.py",
						null, null, null, true),
					CT.dom.node("). Each rule consists of a <b>url</b>, which may be a regular expression, followed by either a <b>script</b> line or a <b>static_dir</b> line.", "span")
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
					CT.dom.link("the compiler", null, "/docs#deploy"),
					CT.dom.pad(),
					CT.dom.node("to switch between compilation modes. Now you know.", "span")
				]
			]
		},
		{
			name: "Request Handling",
			content: [
				CT.dom.node("The", "span"),
				CT.dom.pad(),
				CT.dom.link("dez", null, "https://github.com/bubbleboy14/dez", null, null, null, true),
				CT.dom.node("-backed <b>cantools.web</b> module is built around a", "span"),
				CT.dom.pad(),
				CT.dom.link("modified", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/controller.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.link("SocketController", null,
					"https://github.com/bubbleboy14/dez/blob/master/dez/network/controller.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.node("pulling the strings of", "span"),
				CT.dom.pad(),
				CT.dom.link("2 subclassed", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/daemons.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.link("HTTPApplication", null,
					"https://github.com/bubbleboy14/dez/blob/master/dez/http/application.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.node("instances (for regular <b>HTTP</b> and <b>Admin Servers</b>) and a", "span"),
				CT.dom.pad(),
				CT.dom.link("Cron Manager", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/cron.py",
					null, null, null, true),
				CT.dom.node(". The controller dynamically loads modules (as specified by <b>app.yaml</b> routing rules) to handle cron jobs and (", "span"),
				CT.dom.link("all manner of", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/response.py",
					null, null, null, true),
				CT.dom.node(") requests as they come up.", "span"),
				CT.dom.br(),
				CT.dom.node("At this point you're probably dying to see more, so sneak a peak at the", "span"),
				CT.dom.pad(),
				CT.dom.link("blog plugin", null, "/plugins.html#ctblog"),
				CT.dom.node("'s", "span"),
				CT.dom.pad(),
				CT.dom.link("request handler", null,
					"https://github.com/bubbleboy14/ctblog/blob/master/ctblog/_blog.py",
					null, null, null, true),
				CT.dom.node(".", "span")
			]
		},
		{
			name: "Services",
			content: [
				CT.dom.node("Cron", "div", "bigger bold pv10"),
				[
					CT.dom.node("The", "span"),
					CT.dom.pad(),
					CT.dom.link("cron module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/cron.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.node("parses the <b>cron.yaml</b> file and schedules the individual jobs accordingly. The <b>YAML</b>-style rules look very similar to those found in <b>app.yaml</b> (the routing config file). Anyway, it should look something like this:", "span")
				],
				CT.dom.node([
					"- description: basic scan",
					[
						CT.dom.pad(2),
						CT.dom.node("url: /cronscan", "span")
					],
					[
						CT.dom.pad(2),
						CT.dom.node("schedule: every 24 hours", "span")
					]
				], "div", "code"),
				CT.dom.node("Mail", "div", "bigger bold pv10"),
				[
					CT.dom.node("The", "span"),
					CT.dom.pad(),
					CT.dom.link("mail module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/mail.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.node("is a minimal wrapper around", "span"),
					CT.dom.pad(),
					CT.dom.link("yagmail", null, "https://github.com/kootenpv/yagmail", null, null, null, true),
					CT.dom.node(". To enable mailing, add a sender address to <b>ct.cfg</b>, something like:", "span")
				],
				CT.dom.node("MAILER = Robot &lt;robot@yourthing.com&gt;", "div", "code"),
				"Send emails with <b>send_mail</b>():",
				CT.dom.node([
					"from cantools.web import send_mail",
					CT.dom.br(),
					"send_mail(to='someone@email.com', subject='hello old friend', body='how are you?')"
				], "div", "code")
			]
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
				[
					CT.dom.node("Client-side logging is handled by the", "span"),
					CT.dom.pad(),
					CT.dom.link("CT.log", null, "/docs#ct.js"),
					CT.dom.pad(),
					CT.dom.node("module.", "span")
				],
				CT.dom.node("Server", "div", "bigger bold pv10"),
				"Enable specific logs in your <b>ct.cfg</b> file with the <b>LOG_ALLOW</b> option, something like:",
				CT.dom.node("LOG_ALLOW = DEGUG|ERROR", "div", "code"),
				"By default, cantools emits <b>info</b>, <b>log</b>, and <b>error</b> messages. One might also desire to persist logs to files. For this, we have a few more config lines to play around with:",
				CT.dom.node([
					"WEB_LOG = web.log",
					"ADMIN_LOG = admin.log",
					"PUBSUB_LOG = pubsub.log"
				], "div", "code")

			]
		},
		{
			name: "Caching",
			content: [
				CT.dom.node("Client", "div", "bigger bold pv10"),
				"Caching is supported in multiple layers of the cantools frontend stack.",
				CT.dom.node("CT.data", "div", "big pv10"),
				[
					CT.dom.node("The", "span"),
					CT.dom.pad(),
					CT.dom.link("data module", null, "/docs#data.js"),
					CT.dom.pad(),
					CT.dom.node("provides functions (<b>get</b>(), <b>add</b>(), <b>addSet</b>(), <b>has</b>()) for maintaining a central set of data for use throughout your application.", "span")
				],
				CT.dom.node("CT.net", "div", "big pv10"),
				[
					CT.dom.node("The", "span"),
					CT.dom.pad(),
					CT.dom.link("net module", null, "/docs#ct.js"),
					CT.dom.pad(),
					CT.dom.node("supports request caching (default <b>false</b>) via the <b>setCache</b>() function:", "span")
				],
				CT.dom.node("CT.net.setCache(true);", "div", "code"),
				"Under the hood, <b>setCache</b>() uses <b>CT.storage</b>.",
				CT.dom.node("CT.storage", "div", "big pv10"),
				[
					CT.dom.node("The", "span"),
					CT.dom.pad(),
					CT.dom.link("storage module", null, "/docs#storage.js"),
					CT.dom.pad(),
					CT.dom.node("is intended for session-level data that must persist across pages. It configurably sits atop either <b>localStorage</b> (the default) or <b>sessionStorage</b> (which we shim for old browsers). By default, it treats your data as JSON and insanely compresses it before filing it away.", "span")
				],
				CT.dom.node("Server", "div", "bigger bold pv10"),
				"The server's memcache layer can be accessed through 3 functions found in the <b>web</b> module:",
				CT.dom.node("from cantools.web import getmem, setmem, clearmem", "div", "code"),
				"Those functions are enough to use memcache, but if you're too lazy even for that, you're gonna love the predefined memcache behaviors.",
				CT.dom.node("db", "div", "big pv10"),
				[
					CT.dom.node("The db cache is enabled by default. If all your data transactions are handled through the", "span"),
					CT.dom.pad(),
					CT.dom.link("/_db handler", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/_db.py",
						null, null, null, true),
					CT.dom.node(", which itself is used by", "span"),
					CT.dom.pad(),
					CT.dom.link("CT.db", null, "/docs#db.js"),
					CT.dom.node(", this is the setting for you. If you're messing with data elsewhere, you might want to turn it off in your <b>ct.cfg</b> file, like so:", "span")
				],
				CT.dom.node("MEMCACHE_DB = False", "div", "code"),
				CT.dom.node("request", "div", "big pv10"),
				"Requests can also be globally cached, but this behavior is disabled by default because it only makes sense if the requests change nothing and always return the same response. If you really want to, you can enable it in <b>ct.cfg</b>:",
				CT.dom.node("MEMCACHE_REQUEST = True", "div", "code"),
				"Alternatively, you can selectively enable caching per-request by passing <b>cache=True</b> when you call <b>succeed()</b> and using <b>trysavedresponse()</b>:",
				CT.dom.node([
					"from cantools.web import respond, cgi_get, succeed, trysavedresponse",
					"from mylogic import get_response",
					CT.dom.br(),
					"def response():",
					[
						CT.dom.pad(4),
						CT.dom.node("trysavedresponse()", "span")
					],
					[
						CT.dom.pad(4),
						CT.dom.node("resp = get_response(cgi_get('whatever_token'))", "span")
					],
					[
						CT.dom.pad(4),
						CT.dom.node("succeed(resp, cache=True)", "span")
					],
					CT.dom.br(),
					"respond(response)"
				], "div", "code")
			]
		},
		{
			name: "Plugins",
			content: [
				CT.dom.node("Using Plugins", "div", "bigger bold pv10"),
				[
					CT.dom.node("To initialize a fresh project with one or more plugins, use", "span"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.node("'s <b>-p (--plugins)</b> flag, like so:", "span")
				],
				CT.dom.node("~> ctinit mymusicdotcom -p ctunes", "div", "code"),
				"Child's play. But what about adding some new functionality fragment mid-project? No problem, just add the name of the plugin to the <b>PLUGIN_MODULES</b> line in your <b>ct.cfg</b> file and refresh:",
				CT.dom.node("~/myblogorsomething> ctinit -r", "div", "code"),
				"That's it.",
				CT.dom.node("Building Plugins", "div", "bigger bold pv10"),
				[
					CT.dom.node("Building a plugin is easy. You mainly just need one file, <b>init.py</b>. It tells",
						"span"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.node("how the plugin is supposed to relate to the application. A good example is", "span"),
					CT.dom.pad(),
					CT.dom.link("ctblog", null, "/plugins.html#ctblog"),
					CT.dom.node("'s", "span"),
					CT.dom.pad(),
					CT.dom.link("init config", null,
						"https://github.com/bubbleboy14/ctblog/blob/master/ctblog/init.py",
						null, null, null, true),
					CT.dom.node(". If your frontend requires configuration, simply include a <b>config.js</b> file (", "span"),
					CT.dom.link("ctuser", null, "/plugins.html#ctuser"),
					CT.dom.node("'s", "span"),
					CT.dom.pad(),
					CT.dom.link("configuration", null,
						"https://github.com/bubbleboy14/ctuser/blob/master/ctuser/js/config.js",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.node("is a great example), which", "span"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.node("compiles, along with objects for other plugins and general items like <b>header</b>{} and <b>css</b>[], into <b>core.config</b>.", "span")
				]
			]
		},
		{
			name: "Admin Dashboard",
			content: [
				[
					CT.dom.node("The admin dashboards run on port 8002 by default (see", "span"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.node("options). You can't get in without the admin password, which you set when you", "span"),
					CT.dom.pad(),
					CT.dom.link("run the server", null, "/docs#start"),
					CT.dom.pad(),
					CT.dom.node("for the first time.", "span")
				],
				CT.dom.node("db", "div", "bigger bold pv10"),
				"Peruse and mess with your data.",
				CT.dom.node("memcache", "div", "bigger bold pv10"),
				"Review an up-to-the-moment snapshot of your server's memcache.",
				CT.dom.node("pubsub", "div", "bigger bold pv10"),
				"Who's saying what where?",
				CT.dom.node("logs", "div", "bigger bold pv10"),
				"Explore your logs. It's great!"
			]
		}
	], "ctcontent3", "ctlist3 big");
});