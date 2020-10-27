var _sutil = CT.stream.util = {
	// for single channel av
	blob_to_b64: function(blob, cb) {
		blob ? _sutil.read(blob, cb) : cb();
	},
	b64_to_blob: function(b64, cb) {
		b64 ? fetch(b64.video || b64).then(function(res) {
			return res.blob();
		}).then(cb) : cb();
	},
	blob_to_buffer: function(blob, cb) {
		blob ? _sutil.read(blob, cb, true) : cb();
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
	update: function(signature, process, requiredInitChunk) {
		if (requiredInitChunk && !signature.endsWith("init")) {
			CT.memcache.blob.get(requiredInitChunk, function(d) {
				process(d);
				CT.memcache.blob.get(signature, process, CT.stream.opts.codecs.video);
			}, CT.stream.opts.codecs.video);
		} else
			CT.memcache.blob.get(signature, process, CT.stream.opts.codecs.video);
	},
	_recorder: function(ondata, onrecorder) {
		return function(stream) {
			var segment = 0, recorder = new MediaRecorder(stream, CT.stream.opts.mropts);
			recorder.ondataavailable = function(blobevent) {
				CT.log("ondataavailable!! " + blobevent.data.size);
				segment = (segment + 1) % CT.stream.opts.segments;
				!recorder._stopped && ondata &&
					ondata({ video: blobevent.data }, segment);
			};
			recorder.onerror = function(e) {
				CT.log("error! " + e.message);
			};
			recorder.start(CT.stream.opts.chunk);
			onrecorder && onrecorder(recorder, stream);
		};
	},
	record: function(ondata, onrecorder, onfail) {
		CT.log.startTimer("record", "(attempt)");
		navigator.mediaDevices.getUserMedia({
			video: true, audio: true
		}).then(_sutil._recorder(ondata, onrecorder))["catch"](onfail || function(err) {
			CT.log.endTimer("record", "got error: " + err);
		});
	}
};

CT.stream.util.fzn = {
	_: { vids: {} },
	video: function(channel, videoClass, onrefresh) {
		var _ = CT.stream.util.fzn._, vid = _.vids[channel] = new CT.stream.Video({
			frame: false,
			onrefresh: onrefresh,
			videoClass: videoClass,
			onreset: function() {
				_.bridge.error({
					channel: channel,
					requiredInitChunk: vid.receivedInitChunk
				});
			}
		});
		CT.stream.util.fzn.init();
		_.bridge && _.bridge.subscribe(channel);
		return vid;
	},
	init: function() {
		var _ = CT.stream.util.fzn._, v;
		if (_.bridge) return;
		document.head.appendChild(CT.dom.script("https://localhost:5555/js/CT/bridge.js", null, null, function() {
			_.bridge = PMB.bridge({
				widget: "/stream/vidsrc.html",
				senders: ["subscribe", "error"],
				receivers: {
					clip: function(data) {
						_.vids[data.channel].bufferer(data.data);
					}
				}
			});
			for (v in _.vids)
				_.bridge.subscribe(v);
		}));
	}
};