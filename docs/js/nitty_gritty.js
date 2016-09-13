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
				CT.dom.div("Installing cantools", "bigger bold pv10"),
				"Pop open a terminal and clone cantools:",
				CT.dom.div("~> git clone https://github.com/bubbleboy14/cantools.git", "code"),
				"Install it:",
				CT.dom.div([
					"~> cd cantools",
					"~/cantools> sudo python setup.py install",
					"~/cantools> sudo python setup.py develop",
				], "code"),
				CT.dom.div("Creating A Project", "bigger bold pv10"),
				"Then navigate somewhere else and make up a name for your project:",
				CT.dom.div([
					"~/cantools> cd ..",
					"~> ctinit greatprojectname",
				], "code"),
				CT.dom.div("Refreshing A Project", "bigger bold pv10"),
				"Maybe you're jumping into someone else's project. That's fine. First, make sure cantools is installed (see above). If you already have it, it doesn't hurt to make sure it's up to date. In your terminal:",
				CT.dom.div("~> ctinit -u", "code"),
				[
					CT.dom.span("That command pulls in the latest cantools, and also updates any managed plugins (more about that"),
					CT.dom.pad(),
					CT.dom.link("here", function() {
						CT.dom.id("tlPlugins").trigger();
					}),
					CT.dom.span("). Now navigate to your project and refresh:")
				],
				CT.dom.div([
					"~> cd someproject",
					"~/someproject> ctinit -r"
				], "code"),
				"That command installs all necessary plugins and adds in all the symlinks that don't belong in a repository."
			]
		},
		{
			name: "Object Relational Mapper",
			content: [
				CT.dom.div("Choosing Your Backend", "bigger bold pv10"),
				[
					CT.dom.span("The cantools abstraction layer is like a rodeo performer riding two horses simultaneously:"),
					CT.dom.pad(),
					CT.dom.link("the GAE neopythonic cloud datastore", null,
						"https://cloud.google.com/appengine/docs/python/ndb/", null, null, null, true),
					CT.dom.span("; and the SQL database of your choice (our recommendation), via"),
					CT.dom.pad(),
					CT.dom.link("sqlalchemy", null, "http://www.sqlalchemy.org/", null, null, null, true),
					CT.dom.span(".")
				],
				CT.dom.div("Modeling Data", "bigger bold pv10"),
				[
					CT.dom.span("Now that you've got a project to mess around with, check out model.py. It will be mostly empty. For a good example of the sorts of things you can type there, feast your eyes on the"),
					CT.dom.pad(),
					CT.dom.link("ctuser", null, "/plugins.html#ctuser"),
					CT.dom.pad(),
					CT.dom.span("plugin's"),
					CT.dom.pad(),
					CT.dom.link("model injections", null,
						"https://github.com/bubbleboy14/ctuser/blob/master/ctuser/model.py"),
					CT.dom.span(". Our sleek api is <b>boilerplateless</b> thanks to the"),
					CT.dom.pad(),
					CT.dom.link("metaclass magic of the model module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/model.py")
				],
				CT.dom.div("Queries", "bigger bold pv10"),
				[
					CT.dom.div("Access Your Data", "big pv10"),
					[
						CT.dom.span("The cantools abstraction layer manages"),
						CT.dom.pad(),
						CT.dom.link("database sessions", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/session.py",
							null, null, null, true),
						CT.dom.pad(),
						CT.dom.span("under the hood, allowing numerous incrementally alternating request -bound sessions, as well as any number of simultaneous long-running thread -bound sessions, to coexist, reading and writing data at will. The session manager is utilized by individual"),
						CT.dom.pad(),
						CT.dom.link("Query", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/query.py",
							null, null, null, true),
						CT.dom.pad(),
						CT.dom.span("instances, which in turn are used by the"),
						CT.dom.pad(),
						CT.dom.link("getters", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/getters.py",
							null, null, null, true),
						CT.dom.span(", which themselves instantiate Query objects with the query() function attached to each data model (as do the"),
						CT.dom.pad(),
						CT.dom.link("setters", null,
							"https://github.com/bubbleboy14/cantools/blob/master/cantools/db/sql/setters.py",
							null, null, null, true),
						CT.dom.span(").")
					],
					CT.dom.div("Even From Javascript(!)", "big pv10"),
					[
						CT.dom.span("Check out the"),
						CT.dom.pad(),
						CT.dom.link("CT.db", null, "/docs#db.js"),
						CT.dom.pad(),
						CT.dom.span("module to learn all about querying and messing with your data from all the way over in the client. Really!")
					]
				],
				CT.dom.div("Migration", "bigger bold pv10"),
				[
					CT.dom.span("Wherever you choose to squirrel away your data, you'll eventually have to move it somewhere. Check out"),
					CT.dom.pad(),
					CT.dom.link("ctmigrate", null, "/docs#migrate"),
					CT.dom.pad(),
					CT.dom.span("to learn more!")
				]
			]
		},
		{
			name: "Routing",
			content: [
				CT.dom.div("The Basics", "bigger bold pv10"),
				[
					CT.dom.span("All routing is handled in the <b>app.yaml</b> file,"),
					CT.dom.pad(),
					CT.dom.link("YAML", null, "http://yaml.org/", null, null, null, true),
					CT.dom.span("-style (parsed"),
					CT.dom.pad(),
					CT.dom.link("here", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/routes.py",
						null, null, null, true),
					CT.dom.span("). Each rule consists of a <b>url</b>, which may be a regular expression, followed by either a <b>script</b> line or a <b>static_dir</b> line.")
				],
				CT.dom.div("Static Directories", "bigger bold pv10"),
				"A static rule looks like this:",
				CT.dom.div([
					"- url: /css",
					CT.dom.pad(2),
					CT.dom.span("static_dir: css"),
				], "code"),
				CT.dom.div("Web Handlers", "bigger bold pv10"),
				"A dynamic rule looks like this:",
				CT.dom.div([
					"- url: /_db",
					CT.dom.pad(2),
					CT.dom.span("script: _db.py"),
				], "code"),
				CT.dom.div("What's That Stuff At The Bottom?", "bigger bold pv10"),
				"At some point in your <b>app.yaml</b> file, you'll see the following line:",
				CT.dom.div("## MODE SWITCHING -- DON'T MESS WITH (unless you know what you're doing)!",
					"code"),
				[
					CT.dom.span("The stuff after that is used by"),
					CT.dom.pad(),
					CT.dom.link("the compiler", null, "/docs#deploy"),
					CT.dom.pad(),
					CT.dom.span("to switch between compilation modes. Now you know.")
				]
			]
		},
		{
			name: "Request Handling",
			content: [
				CT.dom.span("The"),
				CT.dom.pad(),
				CT.dom.link("dez", null, "https://github.com/bubbleboy14/dez", null, null, null, true),
				CT.dom.span("-backed <b>cantools.web</b> module is built around a"),
				CT.dom.pad(),
				CT.dom.link("modified", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/controller.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.link("SocketController", null,
					"https://github.com/bubbleboy14/dez/blob/master/dez/network/controller.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.span("pulling the strings of"),
				CT.dom.pad(),
				CT.dom.link("2 subclassed", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/daemons.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.link("HTTPApplication", null,
					"https://github.com/bubbleboy14/dez/blob/master/dez/http/application.py",
					null, null, null, true),
				CT.dom.pad(),
				CT.dom.span("instances (for regular <b>HTTP</b> and <b>Admin Servers</b>) and a"),
				CT.dom.pad(),
				CT.dom.link("Cron Manager", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/cron.py",
					null, null, null, true),
				CT.dom.span(". The controller dynamically loads modules (as specified by <b>app.yaml</b> routing rules) to handle cron jobs and ("),
				CT.dom.link("all manner of", null,
					"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/response.py",
					null, null, null, true),
				CT.dom.span(") requests as they come up."),
				CT.dom.br(),
				CT.dom.span("At this point you're probably dying to see more, so sneak a peak at the"),
				CT.dom.pad(),
				CT.dom.link("blog plugin", null, "/plugins.html#ctblog"),
				CT.dom.span("'s"),
				CT.dom.pad(),
				CT.dom.link("request handler", null,
					"https://github.com/bubbleboy14/ctblog/blob/master/ctblog/_blog.py",
					null, null, null, true),
				CT.dom.span(".")
			]
		},
		{
			name: "Services",
			content: [
				CT.dom.div("Cron", "bigger bold pv10"),
				[
					CT.dom.span("The"),
					CT.dom.pad(),
					CT.dom.link("cron module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/cron.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.span("parses the <b>cron.yaml</b> file and schedules the individual jobs accordingly. The <b>YAML</b>-style rules look very similar to those found in <b>app.yaml</b> (the routing config file). Anyway, it should look something like this:")
				],
				CT.dom.div([
					"- description: basic scan",
					[
						CT.dom.pad(2),
						CT.dom.span("url: /cronscan")
					],
					[
						CT.dom.pad(2),
						CT.dom.span("schedule: every 24 hours")
					]
				], "code"),
				CT.dom.div("Mail", "bigger bold pv10"),
				[
					CT.dom.span("The"),
					CT.dom.pad(),
					CT.dom.link("mail module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/web/dez_server/mail.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.span("is a minimal wrapper around"),
					CT.dom.pad(),
					CT.dom.link("yagmail", null, "https://github.com/kootenpv/yagmail", null, null, null, true),
					CT.dom.span(". To enable mailing, add a sender address to <b>ct.cfg</b>, something like:")
				],
				CT.dom.div("MAILER = Robot &lt;robot@yourthing.com&gt;", "code"),
				"Send emails with <b>send_mail</b>():",
				CT.dom.div([
					"from cantools.web import send_mail",
					CT.dom.br(),
					"send_mail(to='someone@email.com', subject='hello old friend', body='how are you?')"
				], "code")
			]
		},
		{
			name: "Javascript",
			content: [
				"Folks hate Javascript for 2 basic reason: the absence of <b>classes</b> and <b>modules</b>, which constitute the core of most scripting languages; and the auto-open nature of the code, which after all, is directly transmitted by the server. Now don't get me wrong, we're all about open source. We're just not all about vulnerable applications.",
				CT.dom.div("Modules", "bigger bold pv10"),
				CT.dom.div("CT.require", "big pv10"),
				"The <b>CT.require</b>() function ties it all together by dynamically acquiring modules, <b>AJAX</b>-style. Here are a few examples:",
				CT.dom.div([
					"// require a CT package",
					'CT.require("CT.map");',
					CT.dom.br(),
					"// require some other package",
					'CT.require("mything.gizmos");',
					CT.dom.br(),
					"// require dynamically -- compiler skips this import",
					'CT.require("mything.modes." + modeVar, true);'
				], "code"),
				CT.dom.div("CT.scriptImport", "big pv10"),
				"But maybe you want to use some third party library that in turn imports other stuff. Such a library generally determines where to find those other things based on its own location, which is typically derived from its script tag. Without a script tag, all is lost. In these cases, we use <b>CT.scriptImport</b>():",
				CT.dom.div('CT.scriptImport("http://some.third.party.package.com/whatever.js");',
					"code"),
				"<b>CT.require</b>() is synchronous, so you can use the module on the the next line. <b>CT.scriptImport</b>() is asynchronous, so either stick it before the page loads (triggering your main code in an onload callback, for instance via <b>CT.onload</b>()) or include your followup logic in a callback:",
				CT.dom.div([
					'CT.scriptImport("http://some.third.party.package.com/whatever.js");',
					CT.dom.br(),
					'CT.onload(function() {',
					[
						CT.dom.pad(4),
						CT.dom.span('alert("ready to go!");')
					],
					"});"
				], "code"),
				"or",
				CT.dom.div([
					'CT.scriptImport("http://blah.com/bloop.js", function() {',
					[
						CT.dom.pad(4),
						CT.dom.span('alert("ready to go!");')
					],
					"});"
				], "code"),
				CT.dom.div("Classes", "bigger bold pv10"),
				"Classes are the crucial ingredient of any object-oriented project, foremost among the grown-up tools today's rich web applications require to make any sense of the data landscape they necessarily must traverse. Use the <b>CT.Class</b>() function to create a class.",
				CT.dom.div([
					"Person = CT.Class({",
					[
						CT.dom.pad(4),
						CT.dom.span('CLASSNAME: "MyClass",')
					],
					CT.dom.br(),
					[
						CT.dom.pad(4),
						CT.dom.span('init: function(opts) {')
					],
					[
						CT.dom.pad(8),
						CT.dom.span('this.opts = opts;')
					],
					[
						CT.dom.pad(8),
						CT.dom.span('this.name = opts.name;')
					],
					[
						CT.dom.pad(4),
						CT.dom.span('},')
					],
					CT.dom.br(),
					[
						CT.dom.pad(4),
						CT.dom.span('doIt: function() {')
					],
					[
						CT.dom.pad(8),
						CT.dom.span('this.log("we did it! (" + this.name + ")");')
					],
					[
						CT.dom.pad(4),
						CT.dom.span('}')
					],
					"});",
					CT.dom.br(),
					'var plorpus = new Person({ name: "plorpus" });',
					'plorpus.doIt();'
				], "code"),
				CT.dom.div("Compilation Modes", "bigger bold pv10"),
				[
					CT.dom.span("We've got 3 compilation modes for ya. Below are the basics (but you'll want to review the"),
					CT.dom.pad(),
					CT.dom.link("ctdeploy module", null, "/docs#deploy"),
					CT.dom.pad(),
					CT.dom.span("for deets).")
				],
				CT.dom.div("dynamic", "big pv10"),
				"In dynamic, or development mode, your application is loaded in chunks as <b>CT.require</b>() statements are encountered. Your site won't load as quickly as in the other modes, but does not require recompilation to reflect the latest changes.",
				CT.dom.div("static", "big pv10"),
				"In static, or debug mode, all non-dynamic imports (<b>CT.require</b>() statements) are precompiled into the head as script tags referencing the files. These imports, unlike dynamic imports, play nice with the Chrome debugger, enabling, for instance, the developer to set break points that persist between refreshes. The downside is that any changes to the markup (html files) are <b>not</b> reflected in the served application without a recompile.",
				CT.dom.div("production", "big pv10"),
				"In production, or garbled mode, all referenced Javascript is compressed, obfuscated, and compiled into the head of each page. Additionally, production-mode applications encode all client-server communications, rendering your app hard to debug and harder to hack."
			]
		},
		{
			name: "Configuration",
			content: [
				CT.dom.div("Client", "bigger bold pv10"),
				[
					CT.dom.span("The client-side configuration lives in <b>core.config</b>, which is the <b>/js/core/config.js</b> file that is generated by"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.span("on project initialization. It contains the default configuration for each specified plugin, in addition to default (empty) properties used by any page that invokes <b>CT.initCore</b>(): <b>header</b>{}, <b>footer</b>{}, and <b>css</b>[]. The <b>css</b>[] array consists of stylesheet links to be loaded, and <b>header</b>{} / <b>footer</b>{} are passed to the"),
					CT.dom.pad(),
					CT.dom.link("layout module", null, "/docs#layout.js"),
					CT.dom.span(".")
				],
				CT.dom.div("Server", "bigger bold pv10"),
				[
					CT.dom.span("When your application starts up, the"),
					CT.dom.pad(),
					CT.dom.link("config module", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/config.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.span("parses the"),
					CT.dom.pad(),
					CT.dom.link("default server configuration", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/cfg.py",
						null, null, null, true),
					CT.dom.span(". Next, it pulls in each plugin's configuration, as optionally specified by a <b>cfg</b> line in the <b>init.py</b> file found in each plugin. A good example of this can be found in the"),
					CT.dom.pad(),
					CT.dom.link("init", null,
						"https://github.com/bubbleboy14/ctdecide/blob/master/ctdecide/init.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.span("and"),
					CT.dom.pad(),
					CT.dom.link("config", null,
						"https://github.com/bubbleboy14/ctdecide/blob/master/ctdecide/config.py",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.span("files of the"),
					CT.dom.pad(),
					CT.dom.link("decide plugin", null, "/plugins.html#ctdecide"),
					CT.dom.span(". Once the defaults are all loaded, we finally apply the specific application's configuration from <b>ct.cfg</b>, which will look something like this:")
				],
				CT.dom.div([
					"ENCODE = False",
					"MODE = dynamic",
					"WEB_SERVER = dez",
					"PLUGINS = ctuser"
				], "code")
			]
		},
		{
			name: "Logging",
			content: [
				CT.dom.div("Client", "bigger bold pv10"),
				[
					CT.dom.span("Client-side logging is handled by the"),
					CT.dom.pad(),
					CT.dom.link("CT.log", null, "/docs#ct.js"),
					CT.dom.pad(),
					CT.dom.span("module. As a convenience, a <b>log</b>{} object is added to every application's <b>core.config</b> object. It contains two arrays, <b>include</b>[] and <b>exclude</b>[], which the default <b>core.util</b> passes to <b>CT.log.greg</b>():")
				],
				CT.dom.div("CT.log.grep(core.config.log.include, core.config.log.exclude);", "code"),
				CT.dom.div("Server", "bigger bold pv10"),
				"Enable specific logs in your <b>ct.cfg</b> file with the <b>LOG_ALLOW</b> option, something like:",
				CT.dom.div("LOG_ALLOW = DEGUG|ERROR", "code"),
				"By default, cantools emits <b>info</b>, <b>log</b>, and <b>error</b> messages. One might also desire to persist logs to files. For this, we have a few more config lines to play around with:",
				CT.dom.div([
					"WEB_LOG = web.log",
					"ADMIN_LOG = admin.log",
					"PUBSUB_LOG = pubsub.log"
				], "code")
			]
		},
		{
			name: "Caching",
			content: [
				CT.dom.div("Client", "bigger bold pv10"),
				"Caching is supported in multiple layers of the cantools frontend stack.",
				CT.dom.div("CT.data", "big pv10"),
				[
					CT.dom.span("The"),
					CT.dom.pad(),
					CT.dom.link("data module", null, "/docs#data.js"),
					CT.dom.pad(),
					CT.dom.span("provides functions (<b>get</b>(), <b>add</b>(), <b>addSet</b>(), <b>has</b>()) for maintaining a central set of data for use throughout your application.")
				],
				CT.dom.div("CT.net", "big pv10"),
				[
					CT.dom.span("The"),
					CT.dom.pad(),
					CT.dom.link("net module", null, "/docs#ct.js"),
					CT.dom.pad(),
					CT.dom.span("supports request caching (default <b>false</b>) via the <b>setCache</b>() function:")
				],
				CT.dom.div("CT.net.setCache(true);", "code"),
				"Under the hood, <b>setCache</b>() uses <b>CT.storage</b>.",
				CT.dom.div("CT.storage", "big pv10"),
				[
					CT.dom.span("The"),
					CT.dom.pad(),
					CT.dom.link("storage module", null, "/docs#storage.js"),
					CT.dom.pad(),
					CT.dom.span("is intended for session-level data that must persist across pages. It configurably sits atop either <b>localStorage</b> (the default) or <b>sessionStorage</b> (which we shim for old browsers). By default, it treats your data as JSON and insanely compresses it before filing it away.")
				],
				CT.dom.div("Server", "bigger bold pv10"),
				"The server's memcache layer can be accessed through 3 functions found in the <b>web</b> module:",
				CT.dom.div("from cantools.web import getmem, setmem, clearmem", "code"),
				"Those functions are enough to use memcache, but if you're too lazy even for that, you're gonna love the predefined memcache behaviors.",
				CT.dom.div("db", "big pv10"),
				[
					CT.dom.span("The db cache is enabled by default. If all your data transactions are handled through the"),
					CT.dom.pad(),
					CT.dom.link("/_db handler", null,
						"https://github.com/bubbleboy14/cantools/blob/master/cantools/_db.py",
						null, null, null, true),
					CT.dom.span(", which itself is used by"),
					CT.dom.pad(),
					CT.dom.link("CT.db", null, "/docs#db.js"),
					CT.dom.span(", this is the setting for you. If you're messing with data elsewhere, you might want to turn it off in your <b>ct.cfg</b> file, like so:")
				],
				CT.dom.div("MEMCACHE_DB = False", "code"),
				CT.dom.div("request", "big pv10"),
				"Requests can also be globally cached, but this behavior is disabled by default because it only makes sense if the requests change nothing and always return the same response. If you really want to, you can enable it in <b>ct.cfg</b>:",
				CT.dom.div("MEMCACHE_REQUEST = True", "code"),
				"Alternatively, you can selectively enable caching per-request by passing <b>cache=True</b> when you call <b>succeed()</b> and using <b>trysavedresponse()</b>:",
				CT.dom.div([
					"from cantools.web import respond, cgi_get, succeed, trysavedresponse",
					"from mylogic import get_response",
					CT.dom.br(),
					"def response():",
					[
						CT.dom.pad(4),
						CT.dom.span("trysavedresponse()")
					],
					[
						CT.dom.pad(4),
						CT.dom.span("resp = get_response(cgi_get('whatever_token'))")
					],
					[
						CT.dom.pad(4),
						CT.dom.span("succeed(resp, cache=True)")
					],
					CT.dom.br(),
					"respond(response)"
				], "code")
			]
		},
		{
			name: "Plugins",
			content: [
				CT.dom.div("Using Plugins", "bigger bold pv10"),
				[
					CT.dom.span("To initialize a fresh project with one or more plugins, use"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.span("'s <b>-p (--plugins)</b> flag, like so:")
				],
				CT.dom.div("~> ctinit mymusicdotcom -p ctunes", "code"),
				"Child's play. But what about adding some new functionality fragment mid-project? No problem, just add the name of the plugin to the <b>PLUGIN_MODULES</b> line in your <b>ct.cfg</b> file and refresh:",
				CT.dom.div("~/myblogorsomething> ctinit -r", "code"),
				"That's it.",
				CT.dom.div("Building Plugins", "bigger bold pv10"),
				[
					CT.dom.span("Building a plugin is easy. You mainly just need one file, <b>init.py</b>. It tells"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.span("how the plugin is supposed to relate to the application. A good example is"),
					CT.dom.pad(),
					CT.dom.link("ctblog", null, "/plugins.html#ctblog"),
					CT.dom.span("'s"),
					CT.dom.pad(),
					CT.dom.link("init config", null,
						"https://github.com/bubbleboy14/ctblog/blob/master/ctblog/init.py",
						null, null, null, true),
					CT.dom.span(". If your frontend requires configuration, simply include a <b>config.js</b> file ("),
					CT.dom.link("ctuser", null, "/plugins.html#ctuser"),
					CT.dom.span("'s"),
					CT.dom.pad(),
					CT.dom.link("configuration", null,
						"https://github.com/bubbleboy14/ctuser/blob/master/ctuser/js/config.js",
						null, null, null, true),
					CT.dom.pad(),
					CT.dom.span("is a great example), which"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.span("compiles, along with objects for other plugins and general items like <b>header</b>{} and <b>css</b>[], into <b>core.config</b>.")
				]
			]
		},
		{
			name: "Admin Dashboard",
			content: [
				[
					CT.dom.span("The admin dashboards run on port 8002 by default (see"),
					CT.dom.pad(),
					CT.dom.link("ctinit", null, "/docs#init"),
					CT.dom.pad(),
					CT.dom.span("options). You can't get in without the admin password, which you set when you"),
					CT.dom.pad(),
					CT.dom.link("run the server", null, "/docs#start"),
					CT.dom.pad(),
					CT.dom.span("for the first time.")
				],
				CT.dom.div("db", "bigger bold pv10"),
				"Peruse and mess with your data.",
				CT.dom.div("memcache", "bigger bold pv10"),
				"Review an up-to-the-moment snapshot of your server's memcache.",
				CT.dom.div("pubsub", "bigger bold pv10"),
				"Who's saying what where?",
				CT.dom.div("logs", "bigger bold pv10"),
				"Explore your logs. It's great!"
			]
		}
	], "ctcontent3", "ctlist3 big");
});