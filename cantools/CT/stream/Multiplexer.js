CT.stream.Multiplexer = CT.Class({
	CLASSNAME: "CT.stream.Multiplexer",
	mode: "memcache", // websocket|memcache
	modes: {
		memcache: {
			push: function(b64, channel, signature) {
				CT.log.startTimer("memcache_push", signature);
				CT.memcache.set(signature, b64, function() {
					CT.log.endTimer("memcache_push", b64.length);
					CT.pubsub.publish(channel, signature); // (no echo)
				}, false, true);
			},
			update: function(message, process) {
				CT.log.startTimer("memcache_update", message.length);
				CT.memcache.get(message, process, false, true);
				CT.log.endTimer("memcache_update", message.length);
			}
		},
		websocket: {
			push: function(b64, channel, signature) { // no echo!!!
				CT.log.startTimer("websocket_push", signature);
				CT.pubsub.publish(channel, encodeURIComponent(b64));
				CT.log.endTimer("websocket_push", b64.length);
			},
			update: function(message, process) {
				CT.log.startTimer("websocket_update", message.length);
				process(unescape(message));
				CT.log.endTimer("websocket_update", message.length);
			}
		}
	},
	setMode: function(mode) {
		this.mode = mode;
	},
	join: function(channel) {
		if (!(channel in this.channels)) {
			CT.pubsub.subscribe(channel);
			this.channels[channel] = {}; // named streams (Video instances)
		}
	},
	leave: function(channel) {
		if (channel in this.channels) {
			CT.pubsub.unsubscribe(channel);
			Object.values(this.channels).forEach(function(streams) {
				Object.values(streams).forEach(function(video) {
					CT.dom.remove(video.node);
				});
			});
			delete this.channels[channel];
		}
	},
	push: function(blob, segment, channel) {
		CT.log.startTimer("push", channel + segment);
		var that = this, signature = channel + this.opts.user + segment;
		CT.stream.read(blob, function(b64) {
			CT.log.endTimer("push", signature);
			that.modes[that.mode].push(b64, channel, signature);
			that.update({
				user: that.opts.user,
				channel: channel,
				message: (that.mode == "memcache") &&
					signature || encodeURIComponent(b64)
			});
		});
	},
	update: function(data) {
		CT.log.startTimer("update", data.channel);
		var chan = this.channels[data.channel],
			video = chan[data.user];
		if (!video) {
			video = chan[data.user] = new CT.stream.Video();
			CT.dom.addContent(this.opts.node, video.node);
		}
		this.modes[this.mode].update(data.message, video.process);
		CT.log.endTimer("update", data.message.length
			+ " " + data.channel + " " + data.user);
	},
	connect: function() {
		CT.pubsub.connect(this.opts.host, this.opts.port, this.opts.user);
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			host: "localhost",
			port: 8888,
			user: "user" + Math.floor(100 * Math.random()),
			node: document.body,
			autoconnect: true
		});
		this.channels = {}; // each channel can carry multiple video streams
		CT.pubsub.set_cb("message", this.update);
		this.opts.autoconnect && this.connect();
	}
});