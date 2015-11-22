CT.pubsub = {
	"_ws": null,
	"_open": false,
	"_queue": [],
	"_channels": {},
	"_cb_message": function() {}, // override w/ set_cb()
	"_cb_join": function() {}, // override w/ set_cb()
	"_cb_leave": function() {}, // override w/ set_cb()
	"_read": function(msg) {
		CT.pubsub["_read_" + msg.action](msg.data);
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
		CT.pubsub._channels[data.channel].push(data.user);
	},
	"_read_unsubscribe": function(data) {
		CT.pubsub._cb_leave(data.channel, data.user);
		CT.data.remove(CT.pubsub._channels[data.channel], data.user);
	},
	"_register": function() {
		CT.pubsub._open = true;
		CT.pubsub._queue.forEach(CT.pubsub.write);
	},
	"set_cb": function(cb, action) { // action: message|join|leave
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
	"connect": function(host, port, uname) {
		CT.pubsub._ws = new WebSocket("ws://" + host + ":" + port);
		CT.pubsub._ws.onopen = CT.pubsub._register;
		CT.pubsub._ws.onmessage = CT.pubsub._read;
		CT.pubsub.write(uname);
	}
};