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