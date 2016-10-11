/*
This module provides functions for streaming video all over town.
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
		var signature = channel + this.opts.user + segment;
		CT.stream.read(blob, function(b64) {
			CT.memcache.set(signature, b64, function() {
				CT.pubsub.publish(channel, signature);
			});
		});
	},
	update: function(data) {
		var chan = this.channels[data.channel],
			video = chan[data.user] = chan[data.user];
		if (!video) {
			video = chan[data.user] = new CT.stream.Video();
			CT.dom.addContent(this.opts.node, video.node);
		}
		CT.memcache.get(data.message, function(b64) {
			video.process(b64);
		});
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			host: "localhost",
			port: 8888,
			user: "user" + Math.floor(100 * Math.random()),
			node: document.body
		});
		this.channels = {}; // each channel can carry multiple video streams
		CT.pubsub.set_cb("message", this.update);
		CT.pubsub.connect(opts.host, opts.port, opts.user);
	}
});

CT.stream.Streamer = CT.Class({ // memcache
	CLASSNAME: "CT.stream.Streamer",
	set: function(signature, data, cb) {
		CT.memcache.set(signature, data, cb);
	},
	get: function(signature, cb) {
		CT.memcache.get(signature, cb);
	},
	echo: function(signature, blob) {
		var streamer = this;
		CT.stream.read(blob, function(result) {
			streamer.set(signature, result, function() {
				streamer.get(signature, streamer.opts.video.process);
			});
		});
	},
	chunk: function(blob, segment) {
		this.echo(this.opts.channel + segment, blob);
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
		this.node.src ? this.buffer(dataURL) : this.play(dataURL);
	},
	play: function(b64) {
		var video = this.node;
		video.mediaSource = new MediaSource();
		video.src = URL.createObjectURL(video.mediaSource);
		video.mediaSource.onsourceopen = function(e) {
			video.play();
			video.sourceBuffer = video.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
			video.sourceBuffer.mode = 'sequence';
			setTimeout(this.buffer, CT.stream.opts.delay, b64);
		};
	},
	buffer: function(b64) {
		var video = this.node;
		fetch(b64).then(res => res.blob()).then(function(blob) {
			CT.stream.read(blob, function(buffer) {
				video.sourceBuffer.onupdate = function() {
					video.mediaSource.endOfStream();
					video.mediaSource.onsourceopen = function(e) {
						video.play();
					};
					video.play();
				};
				video.sourceBuffer.appendBuffer(buffer);
			}, true);
		});
	},
	init: function(video) {
		this.node = video || CT.dom.video();
	}
});