core.util = {
	_users: ["snuggler", "cuddler", "mittens", "meowzer", "wowzer", "woozle"],
	chat: function() {
		var cimg = CT.dom.img("/img/cat.png", "pointer hoverglow", function() {
			if (cnode.className.indexOf("nobm") == -1)
				cnode.classList.add("nobm");
			else
				cnode.classList.remove("nobm");
		}), cbox = CT.dom.node((new core.util.Chat()).node,
				"div", "w300p h400p"),
			cnode = CT.dom.node([cimg, cbox], "div", "abs r0 b0 above", "chat");
		document.body.appendChild(cnode);
	}
};

core.util.Chat = CT.Class({
	CLASSNAME: "core.util.Chat",
	init: function() {
		var outy = CT.dom.node(null, null, "h4-5 w1", "outy"),
			inny = CT.dom.smartField({
				isTA: true,
				classname: "h1-5 w1",
				blurs: [
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
		this.node = CT.dom.node([outy, inny], "div", "h1 w1");
		CT.pubsub.connect("localhost", 8888);
		CT.pubsub.subscribe("chat");
		CT.pubsub.set_autohistory(true);
		CT.pubsub.set_cb("message", function(data) {
			var u = parseInt(data.user) % core.util._users.length;
			CT.dom.addContent(outy, [
				CT.dom.img("/img/users/" + u + ".jpg"),
				CT.dom.pad(),
				CT.dom.node(core.util._users[u] + " says:", "b"),
				CT.dom.pad(),
				CT.dom.node(data.message, "span")
			]);
		});
	}
});

CT.onload(core.util.chat);