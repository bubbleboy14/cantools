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
	set: function(signature, data, cb) {
		CT.stream.modes[CT.stream.opts.mode].set(signature, data, cb);
	},
	get: function(signature, cb) {
		CT.stream.modes[CT.stream.opts.mode].get(signature, cb);
	},
	echo: function(video, signature, blob) {
		CT.stream.read(blob, function(result) {
			CT.stream.set(signature, result, function() {
				CT.stream.get(signature, function(dataURL) {
					if (!video.src)
						CT.stream.play(video, dataURL);
					else
						CT.stream.buffer(video, dataURL);
				});
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
	record: function(video, ondata, onfail) {
		navigator.getUserMedia({ video: true }, function(stream) {
			video.recorder = new MediaStreamRecorder(stream);
			video.recorder.mimeType = "video/webm";
			video.recorder.ondataavailable = ondata;
			video.recorder.start(CT.stream.opts.chunk);
		}, onfail || CT.log);
	},
	play: function(video, b64) {
		video.mediaSource = new MediaSource();
		video.src = URL.createObjectURL(video.mediaSource);
		video.mediaSource.onsourceopen = function(e) {
			video.play();
			video.sourceBuffer = video.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
			video.sourceBuffer.mode = 'sequence';
			setTimeout(CT.stream.buffer, CT.stream.opts.delay, video, b64);
		};
	},
	pause: function(video) {
		video.recorder.pause();
	},
	buffer: function(video, b64) {
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
	}
};