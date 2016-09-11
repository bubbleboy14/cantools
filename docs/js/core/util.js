core.util = {
	_users: ["snuggler", "cuddler", "mittens", "meowzer", "wowzer", "woozle"],
	chat: function() {
		core.util.chat = new core.util.Chat();
		core.util.chatNode = CT.dom.node([
			CT.dom.img("/img/cat.png", "pointer hoverglow", core.util.toggleChat),
			CT.dom.node(core.util.chat.node, "div", "w300p h400p")
		], "div", "abs r0 b0 above", "chat");
		document.body.appendChild(core.util.chatNode);
	},
	toggleChat: function() {
		core.util.chatNode._on = !core.util.chatNode._on;
		core.util.chat.setActive(core.util.chatNode._on);
		core.util.chatNode.classList[core.util.chatNode._on ? "add" : "remove"]("nobm");
		CT.trans.wobble(core.util._winker, { axis: "y", radius: -5, duration: 200 });
	},
	buildPage: function(data, ctype, ltype) {
		CT.initCore();
		var content = CT.dom.node(null, null, ctype || "ctcontent"),
			clist = CT.dom.node(null, null, ltype || "ctlist big"),
			builder = function(data) {
				CT.dom.setContent(content, [
					CT.dom.node(data.name, "div", "biggerest bold bottompadded"),
					data.content
				]);
			};
		clist.appendChild(CT.panel.triggerList(data, builder));
		CT.dom.setContent("ctmain", [content, clist]);
		var hash = location.hash.slice(1);
		if (hash)
			CT.dom.id("tl" + hash).trigger();
		else
			CT.dom.className("tlitem")[0].trigger();
	},
	settle: function() {
		core.util._winker = CT.dom.id("winker");
		core.util._winker.classList.add("viswink");
		core.util._winker.onclick = core.util.toggleChat;
	},
	init: function() {
		core.util.chat();
		setTimeout(core.util.settle);
	}
};

core.util.Chat = CT.Class({
	CLASSNAME: "core.util.Chat",
	setActive: function(bool) {
		this.active = bool;
	},
	message: function(data) {
		var u = parseInt(data.user) % core.util._users.length;
		CT.dom.addContent(this.outy, [
			CT.dom.img("/img/users/" + u + ".jpg"),
			CT.dom.pad(),
			CT.dom.node(core.util._users[u] + " says:", "b"),
			CT.dom.pad(),
			CT.dom.node(data.message, "span")
		]);
		this.alert.play();
		if (this.active)
			this.outy.lastChild.scrollIntoViewIfNeeded();
	},
	init: function() {
		var inny = CT.dom.smartField({
			isTA: true,
			classname: "h1-5 w1",
			blurs: [
				"any questions?",
				"what's on your mind?",
				"what's the matter?",
				"are you confused?",
				"what's up?"
			],
			cb: function(val) {
				inny.value = "";
				inny.blur();
				CT.pubsub.publish("chat", val);
			}
		});
		this.outy = CT.dom.node(null, null, "h4-5 w1", "outy");
		this.alert = CT.dom.audio("/mp3/alert.mp3");
		this.node = CT.dom.node([this.outy, inny, this.alert], "div", "h1 w1");
		CT.pubsub.connect(location.hostname, 9999);
		CT.pubsub.subscribe("chat");
		CT.pubsub.set_autohistory(true);
		CT.pubsub.set_cb("message", this.message);
	}
});

CT.onload(core.util.init);