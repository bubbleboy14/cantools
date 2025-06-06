var _sutil = CT.stream.util = {
	current: {},
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
			var segment = 0, mroz = CT.stream.opts.mropts,
				recorder = new MediaRecorder(stream, mroz);
			CT.log("recording with opts: " + JSON.stringify(mroz));
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
	record: function(ondata, onrecorder, onfail, mediaType, deviceId, displaySurface) {
		CT.log.startTimer("record", "(attempt)");
		var vo = true;
		if (deviceId || displaySurface) {
			vo = {};
			if (deviceId)
				vo.deviceId = deviceId;
			if (displaySurface)
				vo.displaySurface = displaySurface;
		}
		CT.stream.opts.getter({
			audio: true, video: vo
		}, mediaType).then(_sutil._recorder(ondata, onrecorder))["catch"](onfail || function(err) {
			CT.log.endTimer("record", "got error: " + err);
		});
	},
	stop: function() {
		var cur = _sutil.current;
		if (cur.adhoc) {
			CT.log("stopping adhoc video stream");
			cur.adhoc.remove();
			delete cur.adhoc;
		}
	}
};

var FTEST = false;
var TTEST = false;
var fpz = {
	host: "fzn.party"
}, tpz = {
	host: "tl.fzn.party"
};
fpz.bpath = tpz.bpath = "/CT/bridge.js";
if (FTEST) {
	fpz.host = "localhost:5555";
	fpz.bpath = "/js" + fpz.bpath;
}
if (TTEST) {
	tpz.host = "localhost:8081";
	tpz.bpath = "/js" + tpz.bpath;
}
fpz.fullhost = "https://" + fpz.host;
fpz.stream = fpz.fullhost + "/stream#";
fpz.bridge = fpz.fullhost + fpz.bpath;

tpz.fullhost = "https://" + tpz.host;
tpz.bridge = tpz.fullhost + tpz.bpath;

CT.stream.util.fzn = {
	_: {
		vids: {},
		paths: fpz
	},
	log: function(msg) {
		CT.log("fzn: " + msg);
	},
	streamer: function(chan) {
		var f = CT.dom.iframe(CT.stream.util.fzn._.paths.stream + chan);
		f.setAttribute('allow','microphone; camera');
		return f;
	},
	start: function(vid) {
		var fzn = CT.stream.util.fzn, _ = fzn._;
		if (!_.bridge)
			fzn.log("start aborted - no bridge, waiting");
		else if (!vid.streamup)
			_.bridge.subscribe(vid.channel);
		else if (vid.streamup != "direct")
			_.bridge.stream(vid.channel);
	},
	video: function(channel, videoClass, onrefresh, streamup) {
		var fzn = CT.stream.util.fzn, _ = fzn._, vopts = {
			frame: false,
			domset: true,
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
		}, vid, shouldAllow;
		if (streamup == "direct") {
			vopts.stream = "adhoc";
			vopts.onseg = function(blobs, segment) {
				_.bridge.push({
					channel: channel,
					segment: segment,
					blob: blobs.video
				});
			};
		} else if (streamup)
			shouldAllow = true;
		vid = _.vids[channel] = new CT.stream.Video(vopts);
		vid.channel = channel;
		vid.streamup = streamup;
		fzn.init(shouldAllow);
		fzn.start(vid);
		return vid;
	},
	init: function(shouldAllow) {
		var fzn = CT.stream.util.fzn, _ = fzn._, bropts, v;
		if (_.bridge) return;
		bropts = {
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
		};
		if (shouldAllow)
			bropts.allow = "microphone; camera";
		CT.initBridge(_.paths.bridge, bropts, function(bridge) {
			_.bridge = bridge;
			for (v in _.vids)
				fzn.start(_.vids[v]);
		});
	}
};

CT.stream.util.tl = {
	_: {
		paths: tpz,
		rand: function(p) {
			var _ = CT.stream.util.tl._;
			_.onrand(_.paths.fullhost + p);
		},
		list: function(pdata) { // do something w/ pdata.tagged[]...
			var _ = CT.stream.util.tl._;
			_.onlist(pdata.all);
		},
		request: function(action, channel, cb) {
			var tl = CT.stream.util.tl, _ = tl._;
			_["on" + action] = cb || CT.log;
			if (channel == "surf") // means "no channel"
				channel = null;
			_.chan = channel;
			tl.send(action, channel);
		},
		name2url: function(name) {
			var _ = CT.stream.util.tl._, vpref = "/v/";
			if (_.chan)
				vpref += _.chan + "/";
			return _.paths.fullhost + vpref + name;
		},
		lister: function(cb) {
			return names => cb(names.map(CT.stream.util.tl._.name2url));
		},
		picker: function(cb) {
			return function(names) {
				CT.modal.choice({
					prompt: "please select a video",
					data: names.map(n => n.split(".").shift()),
					cb: name => cb(CT.stream.util.tl._.name2url(name + ".mp4"))
				});
			};
		}
	},
	framed: function(playchan, className) {
		var p = CT.stream.util.tl._.paths.fullhost;
		if (playchan) // playchan = playlist[] or channel""
			p += "#" + (Array.isArray(playchan) ? playchan.join("~") : ("~" + playchan));
		return CT.dom.iframe(p, className || "fullv noborder");
	},
	rand: function(channel, cb) {
		CT.stream.util.tl._.request("rand", channel, cb);
	},
	list: function(channel, cb) {
		var _ = CT.stream.util.tl._;
		_.request("list", channel, _.lister(cb));
	},
	pick: function(channel, cb) {
		var _ = CT.stream.util.tl._;
		_.request("list", channel, _.picker(cb));
	},
	send: function(sender, data) {
		var tl = CT.stream.util.tl, _ = tl._;
		if (_.bridge) return _.bridge[sender](data);
		CT.initBridge(_.paths.bridge, {
			widget: "/blog/rander.html",
			senders: ["rand", "list"],
			receivers: {
				rand: _.rand,
				list: _.list
			}
		}, function(bridge) {
			_.bridge = bridge;
			_.bridge[sender](data);
		});
	}
};