CT.require("CT.all");
CT.require("core");

CT.onload(function() {
	CT.initCore();
	CT.dom.setContent("ctmain", CT.dom.node([
		"A lot of peeps have been saying that cantools is a <b>portable modern web framework</b>, but hey, what does that really mean?",
		CT.dom.node("is it really a webserver?", "div", "big bold"),
		[
			CT.dom.node("Yes, it's primarily a webserver. It sits atop the", "span"),
			CT.dom.pad(),
			CT.dom.link("dez asynchronous network stack", null, "https://github.com/bubbleboy14/dez"),
			CT.dom.node(". Dez itself leverages", "span"),
			CT.dom.pad(),
			CT.dom.link("registered event listener", null, "https://github.com/bubbleboy14/registeredeventlistener"),
			CT.dom.pad(),
			CT.dom.node("to schedule microevents directly with your kernel, breaking down network/io tasks into bite-size chunks. This means you can do whatever insane thing you want with the server -- video streaming, live chat, and every web service you can think of, all at once -- and cantools doesn't give a hoot. In fact, cantools likes it.", "span")
		],
		"The cantools web framework utilizes this foundation to provide the developer with an apparently <i>synchronous</i> api for writing web request handlers.",
		CT.dom.node("but what makes it modern?", "div", "big bold"),
		[
			CT.dom.node("Cantools is modern because it goes beyond providing the tools web developers needed in 1995. Today's web is dynamic, fast-paced, and interactive, and cantools is out there on the frontier with modules like", "span"),
			CT.dom.pad(),
			CT.dom.link("CT.canvas", null, "/docs#canvas.js"),
			CT.dom.pad(),
			CT.dom.node("and", "span"),
			CT.dom.pad(),
			CT.dom.link("CT.video", null, "/docs#video.js"),
			CT.dom.pad(),
			CT.dom.node("that make the most of HTML5. And what about all those old browsers? Well, cantools brings them up to speed with shims for new tech like <b>requestAnimationFrame</b> and <b>sessionStorage</b>.", "span")
		],
		[
			CT.dom.node("Cooler still, cantools comes with a built-in WebSocket pubsub server,", "span"),
			CT.dom.pad(),
			CT.dom.link("ctpubsub", null, "/docs#pubsub"),
			CT.dom.node(", and a client-side module,", "span"),
			CT.dom.pad(),
			CT.dom.link("CT.pubsub", null, "/docs#pubsub.js"),
			CT.dom.node(", to go along with it. Had enough? Well we threw in a framework for building server-side bots, too, so tough tomatoes.", "span")
		],
		[
			CT.dom.node("The modern site requires an assortment of individually complex components interacting in harmony. Therefore, a modern web framework provides generic high-level functionality fragments (for things like a", "span"),
			CT.dom.pad(),
			CT.dom.link("user system", null, "/plugins.html#ctuser"),
			CT.dom.pad(),
			CT.dom.node("or a", "span"),
			CT.dom.pad(),
			CT.dom.link("blog", null, "/plugins.html#ctblog"),
			CT.dom.node(") that can be layered and combined to form a coherent whole -- your site. We achieve this with our", "span"),
			CT.dom.pad(),
			CT.dom.link("plugin system", null, "/plugins.html"),
			CT.dom.node(", which includes a", "span"),
			CT.dom.pad(),
			CT.dom.link("package manager", null, "/docs#init"),
			CT.dom.pad(),
			CT.dom.node("to boot.", "span")
		],
		CT.dom.node("ok, what makes it portable?", "div", "big bold"),
		[
			CT.dom.node("Build one application and run it on any device that tickles your fancy. Mobile Safari? Sure. IE8? Great. Handle input across platforms with", "span"),
			CT.dom.pad(),
			CT.dom.link("CT.gesture", null, "/docs#gesture.js"),
			CT.dom.node(", utilize our responsive", "span"),
			CT.dom.pad(),
			CT.dom.link("CT.layout", null, "/docs#layout.js"),
			CT.dom.pad(),
			CT.dom.node("page components, and even configure zoom/pan rules and a mobile menu with", "span"),
			CT.dom.pad(),
			CT.dom.link("CT.mobile", null, "/docs#mobile.js"),
			CT.dom.node(".", "span")
		],
		[
			CT.dom.node("Think that's great? Well you're gonna love how configurable this puppy is. Hit up the <b>ct.cfg</b> file. Change the WEB_SERVER line to run the whole stack -- request handlers, data-facing code, routing, configuration, and all -- on Google App Engine's cloud (instead of the default", "span"),
			CT.dom.pad(),
			CT.dom.link("dez", null, "https://github.com/bubbleboy14/dez"),
			CT.dom.node("-based asynchronous server and", "span"),
			CT.dom.pad(),
			CT.dom.link("sqlalchemy", null, "http://www.sqlalchemy.org/"),
			CT.dom.node("-based ORM). If you decide against it, that leaves you with the default SQL Object Relational Mapper, which speaks pretty much every SQL dialect known to man <i>without <b>any</b></i> boilerplate. MySQL? Fine. PostgreSQL? Whatever. Defaults to", "span"),
			CT.dom.pad(),
			CT.dom.link("SQLite", null, "https://sqlite.org/"),
			CT.dom.pad(),
			CT.dom.node("so you can get the ball rolling without installing anything complicated.", "span")
		],
		[
			CT.dom.node("AND on top of all that, cantools comes with a suite of migration tools (check out", "span"),
			CT.dom.pad(),
			CT.dom.link("ctmigrate", null, "/docs#migrate"),
			CT.dom.node(") for throwing data around between backends. Are we portable yet?", "span")
		]
	], "div", null, "intro"));
});