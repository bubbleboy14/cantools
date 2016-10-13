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
		segments: 10,
		delay: 2000,
		chunk: 3000
	},
	read: function(blob, cb, buffer) {
		var fr = new FileReader();
		fr.onloadend = function() {
			cb(fr.result);
		};
		buffer ? fr.readAsArrayBuffer(blob) : fr.readAsDataURL(blob);
	},
	record: function(ondata, onrecorder, onfail) {
		navigator.getUserMedia({ video: true }, function(stream) {
			var segment = 0, recorder = new MediaStreamRecorder(stream);
			recorder.mimeType = "video/webm";
			recorder.recorderType = WhammyRecorder;
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
		var that = this, signature = channel + this.opts.user + segment;
		CT.stream.read(blob, function(b64) {
			that.log("push", b64.length);
			CT.memcache.set(signature, b64, function() {
				CT.pubsub.publish(channel, signature);
			});
		});
	},
	update: function(data) {
		this.log("update", data.message);
		var chan = this.channels[data.channel],
			video = chan[data.user] = chan[data.user];
		if (!video) {
			video = chan[data.user] = new CT.stream.Video();
			CT.dom.addContent(this.opts.node, video.node);
		}
		CT.memcache.get(data.message, video.process);
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
				CT.memcache.get(signature, video.process);
			});
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
		this.log("setSourceBuffer");
		this.node.sourceBuffer = this.node.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
		this.node.sourceBuffer.mode = 'sequence';
	},
	start: function() {
		this.log("start (attempting) - paused:", this.node.paused);
		var that = this;
		this.node.play().then(function() {
			that.log("started!!! streaming!");
		}).catch(function(error) {
			that.log("play failed! awaiting user input (android)", error.message);
			var butt = CT.dom.button("ATTACH STREAM", function() {
				that.log("button tapped! playing! paused:", that.node.paused);
				CT.dom.remove(butt);
				that.start();
			}, "gigantic");
			CT.dom.addContent(that.node.parentNode, butt);
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
				video.sourceBuffer.onupdateend = function() {
					that.log("onupdate. readyState:", video.mediaSource.readyState);
					video.mediaSource.endOfStream();
					video.mediaSource.onsourceopen = that.start;
				};
				video.sourceBuffer.appendBuffer(buffer);
			}, true);
		});
	},
	init: function(video) {
		this.node = video || CT.dom.video();
	}
});