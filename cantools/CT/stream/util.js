var _sutil = CT.stream.util = {
	// for single channel av
	blob_to_b64: function(blob, cb) {
		_sutil.read(blob, cb);
	},
	b64_to_blob: function(b64, cb) {
		fetch(b64).then(function(res) { return res.blob(); }).then(cb);
	},
	blob_to_buffer: function(blob, cb) {
		_sutil.read(blob, cb, true);
	},
	b64_to_buffer: function(b64, cb) {
		_sutil.b64_to_blob(b64, function(blob) {
			_sutil.blob_to_buffer(blob, cb);
		});
	},
	// some browsers may require separate audio/video
	blobs_to_b64s: function(blobs, cb) {
		_sutil.blob_to_b64(blobs.video, function(b64video) {
			_sutil.blob_to_b64(blobs.audio, function(b64audio) {
				cb({ video: b64video, audio: b64audio });
			});
		});
	},
	b64s_to_blobs: function(b64s, cb) {
		_sutil.b64_to_blob(b64s.video, function(vblob) {
			_sutil.b64_to_blob(b64s.audio, function(ablob) {
				cb({ video: vblob, audio: ablob });
			});
		});
	},
	blobs_to_buffers: function(blobs, cb) {
		_sutil.blob_to_buffer(blobs.video, function(videobuffer) {
			_sutil.blob_to_buffer(blobs.audio, function(audiobuffer) {
				cb({ video: videobuffer, audio: audiobuffer });
			});
		});
	},
	b64s_to_buffers: function(b64s, cb) {
		_sutil.b64s_to_blobs(b64s, function(blobs) {
			_sutil.blobs_to_buffers(blobs, cb);
		});
	},
	// core functions
	read: function(blob, cb, buffer) {
		var signature = "read" + (buffer ? "buffer" : "url"),
			fr = new FileReader();
		CT.log.startTimer(signature);
		fr.onloadend = function() {
			CT.log.endTimer(signature, fr.result.length || fr.result.byteLength);
			cb(fr.result);
		};
		buffer ? fr.readAsArrayBuffer(blob) : fr.readAsDataURL(blob);
	},
	avRecorder: function(stream) {
		var r = new MediaStreamRecorder(stream);
		r.mimeType = CT.stream.opts.codecs.av;
		return r;
	},
	videoRecorder: function(stream) {
		var r = new MediaStreamRecorder(stream);
		r.mimeType = CT.stream.opts.codecs.video;
		r.recorderType = WhammyRecorder;
		return r;
	},
	audioRecorder: function(stream) {
		var r = new MediaStreamRecorder(stream);
		r.mimeType = CT.stream.opts.codecs.audio;
		r.recorderType = StereoAudioRecorder;
		r.audioChannels = 1;
		return r;
	},
	_multi: function(ondata, onrecorder) {
		return function(stream) {
			CT.log.endTimer("record", "got data!");
			var vrec = _sutil.videoRecorder(stream),
				arec = _sutil.audioRecorder(stream),
				segment = 0, segments = [], addseg = function() {
					if (segment > segments.length - 1) {
						segments.push({
							audio: null,
							video: null
						});
					}
				}, checkseg = function() {
					var seg = segments[segment];
					if (seg && seg.audio && seg.video) {
						ondata(seg, segment);
						segment = (segment + 1) % CT.stream.opts.segments;
						if (!segment)
							segments.length = 0;
					}
				};
			vrec.onStartedDrawingNonBlankFrames = function() {
				CT.log("STARTING AUDIO");
				vrec.clearOldRecordedFrames();
				arec.start(CT.stream.opts.chunk);
			};
			arec.ondataavailable = function(blob) {
				CT.log("AUDIO");
				addseg();
				segments[segment].audio = blob;
				checkseg();
			};
			vrec.ondataavailable = function(blob) {
				CT.log("VIDEO");
				addseg();
				segments[segment].video = blob;
				checkseg();
			};
			vrec.start(CT.stream.opts.chunk);
			onrecorder && onrecorder({
				stop: function() {
					arec.stop();
					vrec.stop();
				},
				save: vrec.save
			}, stream);
		};
	},
	_single: function(ondata, onrecorder) {
		return function(stream) {
			var segment = 0, recorder = _sutil.avRecorder(stream);
			recorder.ondataavailable = function(blob) {
				CT.log("ondataavailable!!");
				segment = (segment + 1) % CT.stream.opts.segments;
				if (!segment)
					segments.length = 0;
				ondata && ondata(blob, segment);
			};
			recorder.start(CT.stream.opts.chunk);
			onrecorder && onrecorder(recorder, stream);
		};
	},
	record: function(ondata, onrecorder, onfail) {
//		var recorder = _sutil._single;
		var recorder = _sutil._multi;
		CT.log.startTimer("record", "(attempt)");
		navigator.mediaDevices.getUserMedia({
			video: true, audio: true
		}).then(recorder(ondata, onrecorder))["catch"](onfail || function(err) {
			CT.log.endTimer("record", "got error: " + err);
		});
	}
};