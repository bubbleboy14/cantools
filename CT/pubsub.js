CT.pubsub = {
	"_": {
		"ws": null,
		"open": false,
		"reconnect": true,
		"reconnect_interval": 250,
		"initialized": false,
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
				CT.pubsub._channels[data.channel] = data;
				data.history.forEach(CT.pubsub._.process.publish);
				CT.pubsub._.process.subscribe(data.channel, data);
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
		}
	},
	"_register": function() {
		CT.pubsub._.open = true;
		CT.pubsub._.queue.forEach(function(item, i) {
			setTimeout(function() {
				CT.pubsub.write(item);
			}, 100 * i);
		});
		CT.pubsub._.cb.open("opened");
	},
	"isInitialized": function() {
		return CT.pubsub._.initialized;
	},
	"set_reconnect": function(bool) {
		CT.pubsub._.reconnect = bool;
	},
	"set_cb": function(action, cb) { // action: message|join|leave|open|close|error
		CT.pubsub.cb[action] = cb;
	},
	"write": function(data) {
		if (CT.pubsub._.open) {
			var dstring = JSON.stringify(data);
			CT.pubsub._.ws.send(dstring);
			console.log("WRITE", dstring);
		} else {
			CT.pubsub._.queue.push(data);
			console.log("QUEUE", JSON.stringify(CT.pubsub._.queue));
		}
	},
	"publish": function(channel, message) {
		CT.pubsub.write({
			"action": "publish",
			"data": {
				"channel": channel,
				"message": message
			}
		});
	},
	"subscribe": function(channel) {
		CT.pubsub.write({
			"action": "subscribe",
			"data": channel
		});
	},
	"unsubscribe": function(channel) {
		CT.pubsub.write({
			"action": "unsubscribe",
			"data": channel
		});
	},
	"connect": function(host, port, uname) {
		CT.pubsub._.initialized = true;
		CT.pubsub._.ws = new WebSocket("ws://" + host + ":" + port);
		CT.pubsub._.ws.onopen = CT.pubsub._register;
		CT.pubsub._.ws.onmessage = CT.pubsub._read;
		CT.pubsub._.ws.onclose = function() {
			CT.pubsub._.cb.close("closed");
		};
		CT.pubsub._.ws.onerror = function(e) {
			CT.pubsub._.cb.error("error", e);
		};
		CT.pubsub.write(uname);
	}
};