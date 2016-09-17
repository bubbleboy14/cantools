CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	CT.initCore();
	CT.dom.setContent("ctmain", CT.dom.div([
		"A lot of peeps have been saying that cantools is a <b>portable modern web framework</b>, but hey, what does that really mean?",
		CT.dom.div("is it really a webserver?", "big bold"),
		[
			CT.dom.span("Yes, it's primarily a webserver. It sits atop the"),
			CT.dom.pad(),
			CT.dom.link("dez asynchronous network stack", null, "https://github.com/bubbleboy14/dez"),
			CT.dom.span(". Dez itself leverages"),
			CT.dom.pad(),
			CT.dom.link("registered event listener", null, "https://github.com/bubbleboy14/registeredeventlistener"),
			CT.dom.pad(),
			CT.dom.span("to schedule microevents directly with your kernel, breaking down network/io tasks into bite-size chunks. This means you can do whatever insane thing you want with the server -- video streaming, live chat, and every web service you can think of, all at once -- and cantools doesn't give a hoot. In fact, cantools likes it.")
		],
		"The cantools web framework utilizes this foundation to provide the developer with an apparently <i>synchronous</i> api for writing web request handlers.",
		CT.dom.div("but wait, i already have a webserver!", "big bold"),
		[
			CT.dom.span("Don't panic, that's fine. Any component of <b>cantools</b>, such as the"),
			CT.dom.pad(),
			CT.dom.link("Web Server", null, "/nitty_gritty.html#RequestHandling"),
			CT.dom.span(", the"),
			CT.dom.pad(),
			CT.dom.link("WebSocket Pubsub Server", null, "/docs#pubsub"),
			CT.dom.span(", the"),
			CT.dom.pad(),
			CT.dom.link("Object-Relational Mapper", null, "/nitty_gritty.html#ObjectRelationalMapper"),
			CT.dom.span(", or the"),
			CT.dom.pad(),
			CT.dom.link("Rich Modular JavaScript Library", null, "/nitty_gritty.html#Javascript"),
			CT.dom.span(", can be used independently (with the exception of certain frontend modules that are tightly coupled with backend components, such as"),
			CT.dom.pad(),
			CT.dom.link("CT.pubsub", null, "/docs#pubsub.js"),
			CT.dom.pad(),
			CT.dom.span("and"),
			CT.dom.pad(),
			CT.dom.link("CT.db", null, "/docs#db.js"),
			CT.dom.span(").")
		],
		CT.dom.div("ok, but what makes it modern?", "big bold"),
		[
			CT.dom.span("Cantools is modern because it goes beyond providing the tools web developers needed in 1995. Today's web is dynamic, fast-paced, and interactive, and cantools is out there on the frontier with modules like"),
			CT.dom.pad(),
			CT.dom.link("CT.canvas", null, "/docs#canvas.js"),
			CT.dom.pad(),
			CT.dom.span("and"),
			CT.dom.pad(),
			CT.dom.link("CT.video", null, "/docs#video.js"),
			CT.dom.pad(),
			CT.dom.span("that make the most of HTML5. And what about all those old browsers? Well, cantools brings them up to speed with shims for new tech like <b>requestAnimationFrame</b> and <b>sessionStorage</b>.")
		],
		[
			CT.dom.span("Cooler still, cantools comes with a built-in WebSocket pubsub server,"),
			CT.dom.pad(),
			CT.dom.link("ctpubsub", null, "/docs#pubsub"),
			CT.dom.span(", and a client-side module,"),
			CT.dom.pad(),
			CT.dom.link("CT.pubsub", null, "/docs#pubsub.js"),
			CT.dom.span(", to go along with it. Had enough? Well we threw in a framework for building server-side bots, too, so tough tomatoes.")
		],
		[
			CT.dom.span("The modern site requires an assortment of individually complex components interacting in harmony. Therefore, a modern web framework provides generic high-level functionality fragments (for things like a"),
			CT.dom.pad(),
			CT.dom.link("user system", null, "/plugins.html#ctuser"),
			CT.dom.pad(),
			CT.dom.span("or a"),
			CT.dom.pad(),
			CT.dom.link("blog", null, "/plugins.html#ctblog"),
			CT.dom.span(") that can be layered and combined to form a coherent whole -- your site. We achieve this with our"),
			CT.dom.pad(),
			CT.dom.link("plugin system", null, "/plugins.html"),
			CT.dom.span(", which includes a"),
			CT.dom.pad(),
			CT.dom.link("package manager", null, "/docs#init"),
			CT.dom.pad(),
			CT.dom.span("to boot.")
		],
		CT.dom.div("what makes it portable?", "big bold"),
		[
			CT.dom.span("Build one application and run it on any device that tickles your fancy. Mobile Safari? Sure. IE8? Great. Handle input across platforms with"),
			CT.dom.pad(),
			CT.dom.link("CT.gesture", null, "/docs#gesture.js"),
			CT.dom.span(", utilize our responsive"),
			CT.dom.pad(),
			CT.dom.link("CT.layout", null, "/docs#layout.js"),
			CT.dom.pad(),
			CT.dom.span("page components, and even configure zoom/pan rules and a mobile menu with"),
			CT.dom.pad(),
			CT.dom.link("CT.mobile", null, "/docs#mobile.js"),
			CT.dom.span(".")
		],
		[
			CT.dom.span("Think that's great? Well you're gonna love how configurable this puppy is. Hit up the <b>ct.cfg</b> file. Change the WEB_SERVER line to run the whole stack -- request handlers, data-facing code, routing, configuration, and all -- on Google App Engine's cloud (instead of the default"),
			CT.dom.pad(),
			CT.dom.link("dez", null, "https://github.com/bubbleboy14/dez"),
			CT.dom.span("-based asynchronous server and"),
			CT.dom.pad(),
			CT.dom.link("sqlalchemy", null, "http://www.sqlalchemy.org/"),
			CT.dom.span("-based ORM). If you decide against it, that leaves you with the default SQL Object Relational Mapper, which speaks pretty much every SQL dialect known to man <i>without <b>any</b></i> boilerplate. MySQL? Fine. PostgreSQL? Whatever. Defaults to"),
			CT.dom.pad(),
			CT.dom.link("SQLite", null, "https://sqlite.org/"),
			CT.dom.pad(),
			CT.dom.span("so you can get the ball rolling without installing anything complicated.")
		],
		[
			CT.dom.span("AND on top of all that, cantools comes with a suite of migration tools (check out"),
			CT.dom.pad(),
			CT.dom.link("ctmigrate", null, "/docs#migrate"),
			CT.dom.span(") for throwing data around between backends. Are we portable yet?")
		]
	], null, "intro"));
});