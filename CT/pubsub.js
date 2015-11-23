CT.pubsub = {
	"_ws": null,
	"_open": false,
	"_initialized": false,
	"_queue": [],
	"_channels": {},
	"_cb_message": CT.data.getLogger("CT.pubsub|message"), // override w/ set_cb()
	"_cb_join": CT.data.getLogger("CT.pubsub|join"), // override w/ set_cb()
	"_cb_leave": CT.data.getLogger("CT.pubsub|leave"), // override w/ set_cb()
	"_cb_open": CT.data.getLogger("CT.pubsub|open"), // override w/ set_cb()
	"_cb_close": CT.data.getLogger("CT.pubsub|close"), // override w/ set_cb()
	"_cb_error": CT.data.getLogger("CT.pubsub|error"), // override w/ set_cb()
	"_read": function(msg) {
		var d = JSON.parse(msg.data);
		CT.pubsub["_read_" + d.action](d.data);
	},
	"_read_channel": function(data) {
		CT.pubsub._channels[data.channel] = data.users;
		data.history.forEach(CT.pubsub._read_publish);
	},
	"_read_publish": function(data) {
		CT.pubsub._cb_message(data.channel, data.user, data.message);
	},
	"_read_subscribe": function(data) {
		CT.pubsub._cb_join(data.channel, data.user);
		CT.data.add(CT.pubsub._channels[data.channel], data.user);
	},
	"_read_unsubscribe": function(data) {
		CT.pubsub._cb_leave(data.channel, data.user);
		CT.data.remove(CT.pubsub._channels[data.channel], data.user);
	},
	"_register": function() {
		CT.pubsub._open = true;
		CT.pubsub._queue.forEach(function(item, i) {
			setTimeout(function() {
				CT.pubsub.write(item);
			}, 100 * i);
		});
		CT.pubsub._cb_open("opened");
	},
	"isInitialized": function() {
		return CT.pubsub._initialized;
	},
	"set_cb": function(action, cb) { // action: message|join|leave|open|close|error
		CT.pubsub["_cb_" + action] = cb;
	},
	"write": function(data) {
		if (CT.pubsub._open) {
			var dstring = JSON.stringify(data);
			CT.pubsub._ws.send(dstring);
			console.log("WRITE", dstring);
		} else {
			CT.pubsub._queue.push(data);
			console.log("QUEUE", JSON.stringify(CT.pubsub._queue));
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
		CT.pubsub._initialized = true;
		CT.pubsub._ws = new WebSocket("ws://" + host + ":" + port);
		CT.pubsub._ws.onopen = CT.pubsub._register;
		CT.pubsub._ws.onmessage = CT.pubsub._read;
		CT.pubsub._ws.onclose = function() {
			CT.pubsub._cb_close("closed");
		};
		CT.pubsub._ws.onerror = function(e) {
			CT.pubsub._cb_error("error", e);
		};
		CT.pubsub.write(uname);
	}
};