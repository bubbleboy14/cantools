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
		"Cantools is modern because it goes beyond providing the tools web developers needed in 1995. Today's web is dynamic, fast-paced, and interactive, and cantools is out there on the frontier with modules like <b>CT.canvas</b> and <b>CT.video</b> that make the most of HTML5.",
		"Cooler still, cantools comes with a built-in WebSocket pubsub server, ctpubsub, and a client-side module, CT.pubsub, to go along with it. Had enough? Well we threw in a framework for building server-side bots, too, so tough tomatoes.",
		CT.dom.node("ok, what makes it portable?", "div", "big bold"),
		"Build one application and run it on any device that tickles your fancy. Mobile Safari? Sure. IE8? Great. Handle input across platforms with <b>CT.gesture</b>, utilize our responsive <b>CT.layout</b> page components, and even configure zoom/pan rules and a mobile menu with <b>CT.mobile</b>.",
		"Think that's great? Well you're gonna love how configurable this puppy is. Hit up the <b>ct.cfg</b> file. Change the WEB_SERVER line to run the whole stack -- request handlers, data-facing code, routing, configuration, and all -- on Google App Engine's cloud (instead of the default <b>dez</b>-based asynchronous server and <b>sqlalchemy</b>-based ORM). If you decide against it, that leaves you with the default SQL Object Relational Mapper, which speaks pretty much every SQL dialect known to man. MySQL? Fine. PostgreSQL? Whatever. Defaults to sqlite, so you can get the ball rolling without installing anything complicated.",
		"AND on top of all that, cantools comes with a suite of migration tools (check out <b>ctmigrate</b>) for throwing data around between backends. Are we portable yet?"
	], "div", null, "intro"));
});