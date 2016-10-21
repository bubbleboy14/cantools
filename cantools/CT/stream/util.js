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
	b64s_to_blobs: function(avobj, cb) {
		_sutil.b64_to_blob(avobj.video, function(b64video) {
			_sutil.b64_to_blob(avobj.audio, function(b64audio) {
				cb({ video: b64video, audio: b64audio });
			});
		});
	},
	blobs_to_buffers: function(avobj, cb) {
		_sutil.read(avobj.video, function(videobuffer) {
			_sutil.read(avobj.audio, function(audiobuffer) {
				cb({ video: videobuffer, audio: audiobuffer });
			}, true);
		}, true);
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
	record: function(ondata, onrecorder, onfail) {
		CT.log.startTimer("record", "attempting record");
		navigator.mediaDevices.getUserMedia(CT.stream.opts.record).then(function(stream) {
			CT.log.endTimer("record", "got data!");
			var segment = 0, recorder;
			if (CT.stream.opts.record.audio) {
				recorder = new MultiStreamRecorder(stream);
				recorder.audioChannels = 1;
			} else
				recorder = new MediaStreamRecorder(stream);
			recorder.mimeType = "video/webm";
			if (CT.info.isChrome)
				recorder.recorderType = WhammyRecorder;
			else
				recorder.recorderType = MediaRecorderWrapper;
			recorder.sampleRate = 22050;
			recorder.ondataavailable = function(data) {
				CT.log("ondataavailable!!");
				segment = (segment + 1) % CT.stream.opts.segments;
				ondata && ondata(CT.stream.opts.record.audio
					? data.video : data, segment);
			};
			recorder.start(CT.stream.opts.chunk);
			onrecorder && onrecorder(recorder, stream);
		})["catch"](onfail || function(err) {
			CT.log.endTimer("record", "got error: " + err);
		});
	}
};