/*
This module provides functions for streaming video all over town.
*/

CT.scriptImport("https://cdn.webrtc-experiment.com/MediaStreamRecorder.js");
CT.stream = {
	opts: {
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
			var recorder = new MediaStreamRecorder(stream);
			recorder.mimeType = "video/webm";
			recorder.ondataavailable = ondata;
			recorder.start(CT.stream.opts.chunk);
			onrecorder && onrecorder(recorder);
		}, onfail || CT.log);
	}
};

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
	chunk: function(blob) {
		this.opts.segment = (this.opts.segment + 1) % 10;
		this.echo("test" + this.opts.segment, blob);
	},
	getNode: function() {
		return this.opts.video.node;
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			segment: 0,
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