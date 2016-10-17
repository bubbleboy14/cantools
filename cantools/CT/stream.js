/*
This module provides functions and classes for streaming video all over town.

Highlights include:

### CT.stream.record(ondata, onrecorder, onfail)
Starts up a video stream from your webcam. Breaks stream into segments as
defined by CT.stream.opts.chunk (default 3000) and CT.stream.opts.segments
(default 10).

### CT.stream.Multiplexer
Uses WebSocket pubsub server (ctpubsub/CT.pubsub) to manage multiple channels,
each streaming metadata pertaining to multiple videos, over a single connection.
The video segments are acquired from the server with the CT.memcache module
and passed to individual CT.stream.Video instances.

### CT.stream.Video
Wraps an HTML5 video tag in a class with functions for streaming a video
that arrives in chunks.
*/

CT.scriptImport("https://cdn.webrtc-experiment.com/MediaStreamRecorder.js");
CT.stream = {
	opts: {
		requiresInput: CT.info.android,
		requestedInput: false,
		segments: 20,
		delay: 500,
		chunk: 1000,
		waiting: [],
		startWaiting: function() {
			CT.stream.opts.waiting.forEach(function(w) { w.start(); });
		}
	},
	read: function(blob, cb, buffer) {
		var signature = "read" + (buffer ? "buffer" : "url"),
			fr = new FileReader();
		CT.log.startTimer(signature);
		fr.onloadend = function() {
			CT.log.endTimer(signature);
			cb(fr.result);
		};
		buffer ? fr.readAsArrayBuffer(blob) : fr.readAsDataURL(blob);
	},
	record: function(ondata, onrecorder, onfail) {
		CT.log.startTimer("record", "attempting record");
		navigator.getUserMedia({ video: true }, function(stream) {
			CT.log.endTimer("record", "got data!");
			var segment = 0, recorder = new MediaStreamRecorder(stream);
			recorder.mimeType = "video/webm";
			recorder.recorderType = WhammyRecorder;
			recorder.sampleRate = 22050;
			recorder.ondataavailable = function(blob) {
				segment = (segment + 1) % CT.stream.opts.segments;
				ondata && ondata(blob, segment);
			};
			recorder.start(CT.stream.opts.chunk);
			onrecorder && onrecorder(recorder);
		}, onfail || CT.log);
	}
};

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

CT.stream.Streamer = CT.Class({
	CLASSNAME: "CT.stream.Streamer",
	bounce: function(signature, blob) {
		var video = this.opts.video;
		CT.stream.read(blob, function(result) {
			CT.memcache.set(signature, result, function() {
				CT.memcache.get(signature, video.process, false, true);
			}, false, true);
		});
	},
	chunk: function(blob, segment) {
		this.bounce(this.opts.channel + segment, blob);
	},
	echo: function(blob, segment) {
		CT.stream.read(blob, this.opts.video.process);
	},
	getNode: function() {
		return this.opts.video.node;
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			channel: "test",
			video: new CT.stream.Video()
		});
	}
});

CT.stream.Video = CT.Class({
	CLASSNAME: "CT.stream.Video",
	process: function(dataURL) {
		this.log("process", dataURL.length);
		this.node.src ? this.buffer(dataURL) : this.play(dataURL);
	},
	setSourceBuffer: function() {
		this.log("setSourceBuffer - exists:", !!this.node.sourceBuffer);
		if (!this.node.sourceBuffer) {
			this.node.sourceBuffer = this.node.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
			this.node.sourceBuffer.mode = 'sequence';
		}
	},
	start: function() {
		this.log("start (attempting) - paused:", this.node.paused);
		var that = this;
		this.node.play().then(function() {
			that.log("started!!! streaming!");
		})["catch"](function(error) {
			that.log("play failed! awaiting user input (android)", error.message);
			if (CT.stream.opts.requiresInput && !CT.stream.opts.requestedInput) {
				CT.stream.opts.requestedInput = true;
				(new CT.modal.Prompt({
					cb: CT.stream.opts.startWaiting,
					transition: "fade",
					style: "single-choice",
					data: [ "Play Stream" ],
					prompt: "Ready to stream?"
				})).show();
			}
			CT.stream.opts.waiting.push(that);
		});
	},
	play: function(b64) {
		this.log("play", b64.length);
		var that = this;
		this.node.mediaSource = new MediaSource();
		this.node.src = window.URL.createObjectURL(this.node.mediaSource);
		this.node.mediaSource.onsourceopen = function(e) {
			that.start();
			that.setSourceBuffer();
			setTimeout(that.buffer, CT.stream.opts.delay, b64);
		};
	},
	buffer: function(b64) {
		this.log("buffer", b64.length);
		var video = this.node, that = this;
		fetch(b64).then(function(res) { return res.blob(); }).then(function(blob) {
			that.log("buffering", blob.size);
			CT.stream.read(blob, function(buffer) {
				var updated = false;
				video.sourceBuffer.onupdateend = function() {
					if (!updated) {
						updated = true;
						return video.sourceBuffer.appendBuffer(buffer);
					}
					that.log("onupdate. readyState:", video.mediaSource.readyState);
					video.mediaSource.endOfStream();
					video.mediaSource.onsourceopen = that.start;
				};
				if (!video.sourceBuffer.updating) {
					updated = true;
					video.sourceBuffer.appendBuffer(buffer);
				}
			}, true);
		});
	},
	init: function(video) {
		this.node = video || CT.dom.video();
	}
});