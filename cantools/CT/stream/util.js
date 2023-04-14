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
	push: function(blob, channel, signature) {
		CT.memcache.blob.set(signature, blob, function() {
			CT.pubsub.publish(channel, {
				action: "clip",
				data: signature
			}); // (no echo)
		});
	},
	sig: function(channel, user, segment, tracker) {
		var signature = channel + user;
		if (!tracker.initChunk) { // requires init chunk
			tracker.initChunk = true;
			signature += "init";
		} else
			signature += segment;
		return signature;
	},
	update: function(signature, process, requiredInitChunk) {
		var mt = CT.stream.opts.mropts.mimeType;
		if (requiredInitChunk && !signature.endsWith("init")) {
			CT.memcache.blob.get(requiredInitChunk, function(d) {
				process(d);
				CT.memcache.blob.get(signature, process, mt);
			}, mt);
		} else
			CT.memcache.blob.get(signature, process, mt);
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
			recorder.onstop = function() {
				if (recorder._resetting) return;
				CT.log("recorder stopped - stopping stream");
				stream.stop();
			};
			recorder.reset = function() {
				CT.log("RESETTING RECORDER (stop/start) -- kinda doesn't work");
				recorder._resetting = true;
				recorder.stop();
//				recorder.start(CT.stream.opts.chunk);
				setTimeout(() => {
					recorder._resetting = false;
					recorder.start(CT.stream.opts.chunk)
				}, 500);
			};
			recorder.start(CT.stream.opts.chunk);
			onrecorder && onrecorder(recorder, stream);
		};
	},
	record: function(ondata, onrecorder, onfail, mediaType, deviceId) {
		CT.log.startTimer("record", "(attempt)");
		var vo = deviceId && { deviceId: deviceId } || true;
		navigator.mediaDevices[mediaType || "getUserMedia"]({
			audio: true, video: vo
		}).then(_sutil._recorder(ondata, onrecorder))["catch"](onfail || function(err) {
			CT.log.endTimer("record", "got error: " + err);
		});
	},
	tl: function(playchan, className) {
		var p = "https://tl.fzn.party";
		if (playchan) // playchan = playlist[] or channel""
			p += "#" + (Array.isArray(playchan) ? playchan.join("~") : ("~" + playchan));
		return CT.dom.iframe(p, className || "fullv noborder");
	}
};

CT.stream.util.fzn = {
	_: { vids: {} },
	log: function(msg) {
		CT.log("fzn: " + msg);
	},
	streamer: function(chan) {
		var f = CT.dom.iframe("https://fzn.party/stream#" + chan);
		f.setAttribute('allow','microphone; camera');
		return f;
	},
	start: function(vid) {
		var fzn = CT.stream.util.fzn, _ = fzn._;
		if (!_.bridge) return fzn.log("start aborted - no bridge, waiting");
		if (vid.streamup)
			(vid.streamup == "direct") || _.bridge.stream(vid.channel);
		else
			_.bridge.subscribe(vid.channel);
	},
	video: function(channel, videoClass, onrefresh, streamup) {
		var fzn = CT.stream.util.fzn, _ = fzn._, vopts = {
			frame: false,
			fullscreen: {},
			activeAudio: true,
			onrefresh: onrefresh,
			videoClass: videoClass,
			onreset: function() {
				if (!_.bridge)
					return fzn.log("video onreset(): no bridge!");
				_.bridge.error({
					channel: channel,
					requiredInitChunk: vid.receivedInitChunk
				});
			}
		}, vid;
		if (streamup == "direct")
			vopts.stream = "adhoc";
		vid = _.vids[channel] = new CT.stream.Video(vopts);
		vid.channel = channel;
		vid.streamup = streamup;
		fzn.init();
		fzn.start(vid);
		return vid;
	},
	init: function() {
		var fzn = CT.stream.util.fzn, _ = fzn._, v;
		if (_.bridge) return;
		document.head.appendChild(CT.dom.script("https://fzn.party/CT/bridge.js", null, null, function() {
			_.bridge = PMB.bridge({
				allow: "microphone; camera",
				widget: "/stream/vidsrc.html",
				senders: ["subscribe", "stream", "push", "error"],
				receivers: {
					clip: function(data) {
						_.vids[data.channel].bufferer(data.data);
					},
					mode: function(data) {
						_.vids[data.channel].setEncoding(data.mode);
					}
				}
			});
			for (v in _.vids)
				fzn.start(_.vids[v]);
		}));
	}
};