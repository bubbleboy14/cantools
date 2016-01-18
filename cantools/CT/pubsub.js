CT.pubsub = {
	"_": {
		"ws": null,
		"args": null,
		"open": false,
		"initialized": false,
		"reconnect": true,
		"reconnect_interval": 250,
		"log": CT.log.getLogger("CT.pubsub"),
		"queue": [],
		"channels": {},
		"cb": { // default callbacks -- override w/ set_cb()
			"pm": CT.log.getLogger("CT.pubsub|pm"),
			"message": CT.log.getLogger("CT.pubsub|message"),
			"subscribe": CT.log.getLogger("CT.pubsub|subscribe"),
			"join": CT.log.getLogger("CT.pubsub|join"),
			"leave": CT.log.getLogger("CT.pubsub|leave"),
			"open": CT.log.getLogger("CT.pubsub|open"),
			"close": CT.log.getLogger("CT.pubsub|close"),
			"wserror": CT.log.getLogger("CT.pubsub|wserror"), // websocket -- almost same as close
			"error": CT.log.getLogger("CT.pubsub|error") // non-fatal pubsub error
		},
		"process": { // pubsub events
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
				CT.data.append(CT.pubsub._.channels[data.channel].presence, data.user);
			},
			"unsubscribe": function(data) {
				CT.pubsub._.cb.leave(data.channel, data.user);
				CT.data.remove(CT.pubsub._.channels[data.channel].presence, data.user);
			},
			"pm": function(data) {
				CT.pubsub._.cb.pm(data.message, data.user);
			},
			"error": function(data) {
				CT.pubsub._.cb.error(data.message);
			}
		},
		"on": { // websocket events
			"open": function() {
				CT.pubsub._.open = true;
				CT.pubsub._.reconnect_interval = 250;
				CT.pubsub._.write({
					"action": "register",
					"data": CT.pubsub._.args[2]
				});
				for (var channel in CT.pubsub._.channels)
					CT.pubsub.subscribe(channel);
				CT.pubsub._.queue.forEach(CT.pubsub._.write);
				CT.pubsub._.queue.length = 0;
				CT.pubsub._.cb.open();
			},
			"close": function() {
				CT.pubsub._.open = false;
				CT.pubsub._.cb.close();
				if (CT.pubsub._.reconnect)
					CT.pubsub._.try_reconnect()
			},
			"error": function() {
				CT.pubsub._.cb.wserror();
			},
			"message": function(msg) {
				var d = JSON.parse(atob(msg.data));
				CT.pubsub._.process[d.action](d.data);
			}
		},
		"write": function(data) {
			if (CT.pubsub._.open) {
				var dstring = JSON.stringify(data),
					b64str = btoa(dstring);
				CT.pubsub._.ws.send(b64str);
				CT.pubsub._.log("WRITE", dstring, b64str);
			} else
				CT.pubsub._.queue.push(data);
		},
		"try_reconnect": function() {
			var r_int = CT.pubsub._.reconnect_interval;
			CT.pubsub._.log("RECONNECT", r_int);
			setTimeout(function() {
				CT.pubsub.connect.apply(null, CT.pubsub._.args)
			}, r_int);
			CT.pubsub._.reconnect_interval = Math.min(2 * r_int, 30000);
		}
	},
	"isInitialized": function() {
		return CT.pubsub._.initialized;
	},
	"set_reconnect": function(bool) {
		CT.pubsub._.reconnect = bool;
	},
	"set_cb": function(action, cb) {
		// action: message|subscribe|join|leave|open|close|error|pm
		CT.pubsub._.cb[action] = cb;
	},
	"pm": function(user, message) {
		CT.pubsub._.write({
			"action": "pm",
			"data": {
				"user": user,
				"message": message
			}
		});
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
		CT.pubsub._.args = arguments;
		CT.pubsub._.initialized = true;
		CT.pubsub._.ws = new WebSocket("ws://" + host + ":" + port);
		for (var action in CT.pubsub._.on)
			CT.pubsub._.ws["on" + action] = CT.pubsub._.on[action];
		window.onbeforeunload = function() {
			CT.pubsub._.write({ "action": "close" });
		};
	}
};