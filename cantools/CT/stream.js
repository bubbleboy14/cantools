/*
This module provides functions for streaming video all over town.
*/

CT.scriptImport("https://cdn.webrtc-experiment.com/MediaStreamRecorder.js");
CT.stream = {
	opts: {
		delay: 2000,
		chunk: 3000,
		mode: "memcache"
	},
	modes: {
		memcache: {
			set: function(signature, data, cb) {
				CT.memcache.set(signature, data, cb);
			},
			get: function(signature, cb) {
				CT.memcache.get(signature, cb);
			}
		}
	},
	setMode: function(mode) {
		CT.stream.opts.mode = mode;
	},
	set: function(signature, data, cb) {
		CT.stream.modes[CT.stream.opts.mode].set(signature, data, cb);
	},
	get: function(signature, cb) {
		CT.stream.modes[CT.stream.opts.mode].get(signature, cb);
	},
	echo: function(video, signature, blob) {
		CT.stream.read(blob, function(result) {
			CT.stream.set(signature, result, function() {
				CT.stream.get(signature, video.process);
			});
		});
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
		this.node = video;
	}
});