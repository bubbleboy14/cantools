/*
This module provides a direct interface with the ctpubsub backend. Here's how to use it.

	CT.pubsub.connect(host, port, uname)
	CT.pubsub.publish(channel, message)
	CT.pubsub.subscribe(channel)
	CT.pubsub.unsubscribe(channel)
	CT.pubsub.meta(channel, meta)
	CT.pubsub.chmeta(channel, meta, nomerge)
	CT.pubsub.pm(user, message)
	CT.pubsub.set_cb(action, cb)
	CT.pubsub.set_reconnect(bool)
	CT.pubsub.isInitialized() (returns bool)
*/

CT.pubsub = {
	"_": {
		"ws": null,
		"b64": false,
		"args": null,
		"open": false,
		"initialized": false,
		"autohistory": false,
		"autohistory_exemptions": [],
		"reconnect": true,
		"reconnect_interval": 250,
		"protocol": location.protocol == "http:" && "ws" || "wss",
		"log": CT.log.getLogger("CT.pubsub"),
		"queue": [],
		"channels": {},
		"cb": { // default callbacks -- override w/ set_cb()
			"snapshot": CT.log.getLogger("CT.pubsub|snapshot"),
			"pm": CT.log.getLogger("CT.pubsub|pm"),
			"meta": CT.log.getLogger("CT.pubsub|meta"),
			"chmeta": CT.log.getLogger("CT.pubsub|chmeta"),
			"message": CT.log.getLogger("CT.pubsub|message"),
			"subscribe": CT.log.getLogger("CT.pubsub|subscribe"),
			"join": CT.log.getLogger("CT.pubsub|join"),
			"leave": CT.log.getLogger("CT.pubsub|leave"),
			"presence": CT.log.getLogger("CT.pubsub|presence"),
			"open": CT.log.getLogger("CT.pubsub|open"),
			"close": CT.log.getLogger("CT.pubsub|close"),
			"wserror": CT.log.getLogger("CT.pubsub|wserror"), // websocket -- almost same as close
			"error": CT.log.getLogger("CT.pubsub|error") // non-fatal pubsub error
		},
		"process": { // pubsub events
			"channel": function(data) {
				var _ = CT.pubsub._;
				if (data.meta) {
					data.metamap = {};
					data.presence.forEach(function(u, i) {
						data.metamap[u] = data.meta.users[i];
					});
				}
				_.channels[data.channel] = data;
				_.cb.subscribe(data);
				if (_.autohistory && (_.autohistory_exemptions.indexOf(data.channel) == -1))
					data.history.forEach(CT.pubsub._.process.publish);
				CT.pubsub._.cb.presence(data.presence.length, data.channel);
			},
			"meta": function(data) {
				CT.pubsub._.channels[data.channel].metamap[data.user] = data.meta;
				CT.pubsub._.cb.meta(data);
			},
			"chmeta": function(data) {
				CT.diffmerge(CT.pubsub._.channels[data.channel].meta.channel, data.meta);
				CT.pubsub._.cb.chmeta(data);
			},
			"publish": function(data) {
				CT.pubsub._.cb.message(data);
			},
			"subscribe": function(data) {
				CT.pubsub._.cb.join(data.channel, data.user, data.meta);
				var chan = CT.pubsub._.channels[data.channel];
				if (chan) {
					if (chan.metamap)
						chan.metamap[data.user] = data.meta;
					CT.data.append(chan.presence, data.user);
					CT.pubsub._.cb.presence(chan.presence.length, data.channel);
				}
			},
			"unsubscribe": function(data) {
				CT.pubsub._.cb.leave(data.channel, data.user);
				var chan = CT.pubsub._.channels[data.channel];
				if (chan) {
					if (chan.metamap)
						delete chan.metamap[data.user];
					CT.data.remove(chan.presence, data.user);
					CT.pubsub._.cb.presence(chan.presence.length, data.channel);
				}
			},
			"pm": function(data) {
				CT.pubsub._.cb.pm(data.message, data.user);
			},
			"error": function(data) {
				CT.pubsub._.cb.error(data.message);
			},
			"snapshot": function(data) {
				CT.pubsub._.cb.snapshot(data);
				data.channels.forEach(function(c) {
					var cdata = CT.pubsub._.channels[c.name] = {
						channel: c.name,
						presence: c.users
					};
					CT.pubsub._.cb.subscribe(cdata);
				});
			}
		},
		"on": { // websocket events
			"open": function() {
				CT.pubsub._.open = true;
				CT.pubsub._.reconnect_interval = 250;
				CT.pubsub._.write({
					"action": "register",
					"data": CT.pubsub._.args[2],
					"meta": CT.pubsub._.args[4]
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
				var _ = CT.pubsub._,
					d = JSON.parse(_.b64 ? atob(msg.data) : msg.data);
				_.process[d.action](d.data);
			}
		},
		"write": function(data) {
			var _ = CT.pubsub._;
			if (_.open) {
				var dstring = JSON.stringify(data);
				_.ws.send(_.b64 ? btoa(dstring) : dstring);
			} else
				_.queue.push(data);
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
	"set_b64": function(bool) {
		CT.pubsub._.b64 = bool;
	},
	"set_protocol": function(protocol) {
		CT.pubsub._.protocol = protocol;
	},
	"set_reconnect": function(bool) {
		CT.pubsub._.reconnect = bool;
	},
	"set_autohistory": function(bool, exemptions, mergeExemptions) {
		CT.pubsub._.autohistory = bool;
		if (exemptions) {
			if (mergeExemptions) {
				exemptions.forEach(function(e) {
					CT.pubsub._.autohistory_exemptions.push(e);
				});
			} else
				CT.pubsub._.autohistory_exemptions = exemptions;
		}
	},
	"set_cb": function(action, cb) {
		// action: message|subscribe|join|leave|presence|open|close|error|pm|meta|chmeta
		CT.pubsub._.cb[action] = cb;
	},
	"presence": function(channel) {
		return CT.pubsub._.channels[channel].presence;
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
	"meta": function(channel, meta) {
		CT.pubsub._.write({
			"action": "meta",
			"data": {
				"channel": channel,
				"meta": meta
			}
		});
	},
	"chmeta": function(channel, meta, nomerge) {
		var _ = CT.pubsub._, cmeta = _.channels[channel].meta;
		if (nomerge)
			cmeta.channel = meta;
		else
			CT.diffmerge(cmeta.channel, meta);
		_.write({
			"action": "chmeta",
			"data": {
				"channel": channel,
				"meta": meta
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
	"connect": function(host, port, uname, onbeforeunload, meta) {
		CT.pubsub._.args = arguments;
		CT.pubsub._.initialized = true;
		CT.pubsub._.ws = new WebSocket(CT.pubsub._.protocol + "://" + host + ":" + port);
		for (var action in CT.pubsub._.on)
			CT.pubsub._.ws["on" + action] = CT.pubsub._.on[action];
		window.addEventListener(CT.info.isFirefox ? "unload" : "beforeunload", function() {
			onbeforeunload && onbeforeunload();
			CT.pubsub._.write({ "action": "close" });
		});
	}
};