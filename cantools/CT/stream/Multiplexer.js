CT.stream.Multiplexer = CT.Class({
	CLASSNAME: "CT.stream.Multiplexer",
	mode: "memcache", // websocket|memcache
	modes: {
		memcache: {
			push: function(b64s, channel, signature) {
				CT.log.startTimer("memcache_push", signature);
				CT.memcache.set(signature, b64s, function() {
					CT.log.endTimer("memcache_push", b64s.video.length,
						b64s.audio && b64s.audio.length);
					CT.pubsub.publish(channel, signature); // (no echo)
				}, true);
			},
			update: function(message, process) {
				CT.log.startTimer("memcache_update", message.length);
				CT.memcache.get(message, process, true);
				CT.log.endTimer("memcache_update", message.length);
			}
		},
		websocket: { // buggy AND needs multistream support!! (don't use)
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
		if (this.opts.singlechannel) {
			var ckeys = Object.keys(this.channels);
			if (ckeys.length)
				this.leave(ckeys[0]);
		}
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
	push: function(blobs, segment, channel, stream) {
		CT.log.startTimer("push", channel + segment);
		var that = this, signature = channel + this.opts.user + segment,
			video = this.getVideo(channel, this.opts.user, stream);
		if (video.activeAudio) {
			CT.stream.util.blobs_to_b64s(blobs, function(b64s) {
				CT.log.endTimer("push", signature);
				that.modes[that.mode].push(b64s, channel, signature);
			});
		} else {
			CT.stream.util.blob_to_b64(blobs.video, function(b64) {
				CT.log.endTimer("push", signature);
				that.modes[that.mode].push({
					audio: null,
					video: b64
				}, channel, signature);
			});
		}
		return video;
	},
	update: function(data) {
		CT.log.startTimer("update", data.channel);
		this.modes[this.mode].update(data.message,
			this.getVideo(data.channel, data.user).process);
		CT.log.endTimer("update", data.message.length
			+ " " + data.channel + " " + data.user);
	},
	getVideo: function(channel, user, stream) {
		var chan = this.channels[channel],
			video = chan[user];
		if (!video) {
			video = chan[user] = new CT.stream.Video({ stream: stream });
			CT.dom.addContent(this.opts.node, video.node);
		}
		return video;
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
			autoconnect: true,
			singlechannel: false,
			wserror: null
		});
		this.channels = {}; // each channel can carry multiple video streams
		CT.pubsub.set_cb("message", this.update);
		opts.wserror && CT.pubsub.set_cb("wserror", opts.wserror);
		this.opts.autoconnect && this.connect();
	}
});