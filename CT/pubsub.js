CT.pubsub = {
	"_": {
		"ws": null,
		"open": false,
		"reconnect": true,
		"reconnect_interval": 250,
		"initialized": false,
		"log": CT.data.getLogger("CT.pubsub"),
		"queue": [],
		"channels": {},
		"cb": {
			"message": CT.data.getLogger("CT.pubsub|message"), // override w/ set_cb()
			"subscribe": CT.data.getLogger("CT.pubsub|subscribe"), // override w/ set_cb()
			"join": CT.data.getLogger("CT.pubsub|join"), // override w/ set_cb()
			"leave": CT.data.getLogger("CT.pubsub|leave"), // override w/ set_cb()
			"open": CT.data.getLogger("CT.pubsub|open"), // override w/ set_cb()
			"close": CT.data.getLogger("CT.pubsub|close"), // override w/ set_cb()
			"error": CT.data.getLogger("CT.pubsub|error"), // override w/ set_cb()
		},
		"process": {
			"read": function(msg) {
				var d = JSON.parse(msg.data);
				CT.pubsub._.process[d.action](d.data);
			},
			"channel": function(data) {
				CT.pubsub._.channels[data.channel] = data;
				data.history.forEach(CT.pubsub._.process.publish);
				CT.pubsub._.cb.subscribe(data);
			},
			"publish": function(data) {
				CT.pubsub._.cb.message(data);
			},
			"subscribe": function(data) {
				CT.pubsub._.cb.join(data.channel, data.user);
				CT.data.add(CT.pubsub._.channels[data.channel].users, data.user);
			},
			"unsubscribe": function(data) {
				CT.pubsub._.cb.leave(data.channel, data.user);
				CT.data.remove(CT.pubsub._.channels[data.channel].users, data.user);
			}
		},
		"register": function() {
			CT.pubsub._.open = true;
			CT.pubsub._.queue.forEach(function(item, i) {
				setTimeout(function() {
					CT.pubsub._.write(item);
				}, 100 * i);
			});
			CT.pubsub._.queue.length = 0;
			CT.pubsub._.cb.open();
		},
		"write": function(data) {
			if (CT.pubsub._.open) {
				var dstring = JSON.stringify(data);
				CT.pubsub._.ws.send(dstring);
				CT.pubsub._.log("WRITE", dstring);
			} else {
				CT.pubsub._.queue.push(data);
				CT.pubsub._.log("QUEUE", JSON.stringify(CT.pubsub._.queue));
			}
		}
	},
	"isInitialized": function() {
		return CT.pubsub._.initialized;
	},
	"set_reconnect": function(bool) {
		CT.pubsub._.reconnect = bool;
	},
	"set_cb": function(action, cb) { // action: message|join|leave|open|close|error
		CT.pubsub._.cb[action] = cb;
	},
	"publish": function(channel, message) {
		CT.pubsub._.write({
			"action": "publish",
			"data": {
				"channel": channel,
				"message": message
			}
		});
	},
	"subscribe": function(channel) {
		CT.pubsub._.write({
			"action": "subscribe",
			"data": channel
		});
	},
	"unsubscribe": function(channel) {
		CT.pubsub._.write({
			"action": "unsubscribe",
			"data": channel
		});
	},
	"connect": function(host, port, uname) {
		CT.pubsub._.initialized = true;
		CT.pubsub._.ws = new WebSocket("ws://" + host + ":" + port);
		CT.pubsub._.ws.onopen = CT.pubsub._.register;
		CT.pubsub._.ws.onmessage = CT.pubsub._.process.read;
		CT.pubsub._.ws.onclose = function() {
			CT.pubsub._.open = false;
			CT.pubsub._.cb.close();
		};
		CT.pubsub._.ws.onerror = function() {
			CT.pubsub._.cb.error();
		};
		CT.pubsub._.write({
			"action": "register",
			"data": uname
		});
	}
};