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
					CT.pubsub.publish(channel, {
						action: "clip",
						data: signature
					}); // (no echo)
				}, true);
			},
			update: function(message, process) {
				CT.log.startTimer("memcache_update", message.length);
				CT.memcache.get(message.data, process, true);
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
			this.channel = channel;
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
		if (video.audio.active) {
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
	chat: function(message, user) {
		if (this.opts.chat) {
			var id = parseInt((user || this.opts.user).slice(4)),
				msg = CT.dom.div(message.data);
			msg.style.color = this.opts.chatcolors[id % this.opts.chatcolors.length];
			this.chatOut.appendChild(msg);
			msg.scrollIntoViewIfNeeded();
		}
	},
	say: function(msg) { // single only for now!!!
		this.chatIn.value = "";
		CT.pubsub.publish(this.channel, {
			action: "chat",
			data: msg
		});
		this.chat({ data: msg }); // no bounce back!!!
	},
	update: function(data) {
		CT.log.startTimer("update", data.channel);
		if (data.message.action == "clip") {
			this.modes[this.mode].update(data.message,
				this.getVideo(data.channel, data.user).process);
		} else // chat
			this.chat(data.message, data.user);
		CT.log.endTimer("update", data.message.length
			+ " " + data.channel + " " + data.user);
	},
	getVideo: function(channel, user, stream) {
		var chan = this.channels[channel],
			video = chan[user];
		if (!video) {
			video = chan[user] = new CT.stream.Video(CT.merge(this.opts.vidopts, { stream: stream }));
			CT.dom.addContent(this.opts.node, video.node);
		}
		return video;
	},
	connect: function() {
		CT.pubsub.connect(this.opts.host, this.opts.port, this.opts.user);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			host: "localhost",
			port: 8888,
			user: "user" + Math.floor(100 * Math.random()),
			node: document.body,
			autoconnect: true,
			singlechannel: false,
			wserror: null,
			chat: true,
			title: null,
			vidopts: {},
			chatcolors: ["pink", "purple", "blue", "green", "red", "orange", "yellow"],
			chatblurs: ["say what?", "any questions?", "what's up?"]
		});
		if (opts.chat) { // auto-sets singlechannel to true --> multi later!!
			opts.singlechannel = true;
			this.chatOut = CT.dom.div(null, "abs l0 t50 r0 b15 scrolly green pointer");
			var ci = this.chatIn = CT.dom.smartField({
				cb: this.say,
				blurs: opts.chatblurs,
				classname: "abs l0 b0 r0 h15p w1 p0 m0 noborder"
			});
			this.chatOut.onclick = function() { ci.focus(); };
			opts.title.classList.remove("biggest");
			opts.title.classList.add("bigger");
			CT.dom.setContent(opts.chat, [opts.title, this.chatOut, this.chatIn]);
		}
		this.channels = {}; // each channel can carry multiple video streams
		CT.pubsub.set_cb("message", this.update);
		opts.wserror && CT.pubsub.set_cb("wserror", opts.wserror);
		opts.autoconnect && this.connect();
	}
});