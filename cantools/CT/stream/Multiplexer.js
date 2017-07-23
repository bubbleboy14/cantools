CT.stream.Multiplexer = CT.Class({
	CLASSNAME: "CT.stream.Multiplexer",
	initChunk: false,
	_push: function(b64s, channel, signature) {
		CT.memcache.set(signature, b64s, function() {
			CT.pubsub.publish(channel, {
				action: "clip",
				data: signature
			}); // (no echo)
		});
	},
	_update: function(message, process, requiredInitChunk) {
		if (requiredInitChunk && !message.data.endsWith("init")) {
			CT.memcache.get(requiredInitChunk, function(d) {
				process(d);
				CT.memcache.get(message.data, process);
			});
		} else
			CT.memcache.get(message.data, process);
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
			Object.values(this.channels[channel]).forEach(function(video) {
				video.remove();
			});
			delete this.channels[channel];
		}
	},
	unsub: function(channel, user) {
		var chan = this.channels[channel];
		if (chan && chan[user]) {
			chan[user].remove();
			delete chan[user];
			if (!Object.keys(chan).length && this.opts.onstop)
				this.opts.onstop();
		}
	},
	stop: function() {
		for (var chan in this.channels)
			this.leave(chan);
	},
	push: function(blobs, segment, channel, stream) {
		CT.log.startTimer("push", channel + segment);
		var that = this, signature = channel + this.opts.user,
			video = this.getVideo(channel, this.opts.user, stream);
		if (!this.initChunk) {// requires init chunk
			this.initChunk = true;
			signature += "init";
		} else
			signature += segment;
		video.recorder && video.recorder.remember(blobs.video);
		if (video.audio.active) {
			CT.stream.util.blobs_to_b64s(blobs, function(b64s) {
				CT.log.endTimer("push", signature);
				that._push(b64s, channel, signature);
			});
		} else {
			CT.stream.util.blob_to_b64(blobs.video, function(b64) {
				CT.log.endTimer("push", signature);
				that._push({
					audio: null,
					video: b64
				}, channel, signature);
			});
		}
		return video;
	},
	chat: function(message, user) {
		if (this.opts.chat) {
			user = user || this.opts.user;
			var id = parseInt(user.slice(4)),
				msg = CT.dom.div(this.opts.chatnames ? [
					CT.dom.span(user, "bold"),
					CT.dom.pad(),
					CT.dom.span(message.data)
				] : message.data);
			if (isNaN(id))
				id = user.length;
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
	resetcb: function(chan, user) {
		return function() {
			CT.pubsub.publish(chan, {
				action: "error",
				data: user
			});
		};
	},
	update: function(data) {
		CT.log.startTimer("update", data.channel);
		if (data.message.action == "clip") {
			var v = this.getVideo(data.channel, data.user);
			this._update(data.message, v.process, v.requiredInitChunk);
			if (v.requiredInitChunk) {
				v.receivedInitChunk = v.requiredInitChunk;
				delete v.requiredInitChunk;
			}
		} else if (data.message.action == "chat")
			this.chat(data.message, data.user);
		else if (data.message.action == "error" && this.opts.onerror)
			this.opts.onerror(data.message.data);
		CT.log.endTimer("update", data.message.data.length
			+ " " + data.channel + " " + data.user);
	},
	getVideo: function(channel, user, stream) {
		var chan = this.channels[channel],
			video = chan[user];
		if (!video) {
			if (!Object.keys(chan).length && this.opts.onstart)
				this.opts.onstart();
			video = chan[user] = new CT.stream.Video(CT.merge(this.opts.vidopts,
				{ stream: stream, onreset: this.resetcb(channel, this.opts.user) }));
			CT.dom.addContent(this.opts.node, video.node);
			video.requiredInitChunk = !stream && (channel + user + "init");
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
			onstart: null,
			onstop: null,
			onerror: null,
			wserror: null,
			chat: true,
			title: null,
			vidopts: {},
			closeunsubs: true,
			chatnames: false,
			chatclass: "green",
			chatcolors: ["pink", "purple", "blue", "green", "red", "orange", "yellow"],
			chatblurs: ["say what?", "any questions?", "what's up?"]
		});
		if (opts.chat) { // auto-sets singlechannel to true --> multi later!!
			opts.singlechannel = true;
			this.chatOut = CT.dom.div(null, "abs l0 t50 r0 b15 scrolly pointer " + opts.chatclass);
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
		if (opts.closeunsubs)
			CT.pubsub.set_cb("leave", this.unsub);
		opts.wserror && CT.pubsub.set_cb("wserror", opts.wserror);
		opts.autoconnect && this.connect();
	}
});