CT.stream.Video = CT.Class({
	CLASSNAME: "CT.stream.Video",
	_: {}, // TODO: move _ stuff here....
	_buffers: [],
	_lastTime: 0,
	_nextChunk: 0,
	_sourceOpen: function() {
		this.log("sourceopen");
		this.setSourceBuffer();
	},
	_sourceUpdate: function() {
		this.log("_sourceUpdate", this._buffers.length,
			(this.sourceBuffer && this.sourceBuffer.updating));//, this.mediaSource.readyState);
		if (this.video.error) {
			this.log("ERROR - RESET video", this.video.error);
			this.reset();
		} else if (this.sourceBuffer && !this.sourceBuffer.updating) {
			if (this._buffers.length)
				this.sourceBuffer.appendBuffer(this._buffers.shift());
			else if (this.mediaSource.readyState == "open")
				this.mediaSource.endOfStream();
		}
	},
	_error: function(e) {
		this.log("ERROR RESET", e.message, e.target.error);
		this.reset();
	},
	setSourceBuffer: function() {
		var mt = this.opts.mimeType;
		this.log("setSourceBuffer - exists:", !!this.sourceBuffer, "mimeType", mt);
		if (this.mediaSource.readyState == "closed") {
			this.log("mediaSource readyState is closed -- recreating");
			this.setMediaSource();
		} else if (!this.sourceBuffer) {
			this.sourceBuffer = this.mediaSource.addSourceBuffer(mt);
			this.sourceBuffer.mode = 'segments';
			this.sourceBuffer.addEventListener("updateend", this._sourceUpdate);
			this.sourceBuffer.addEventListener("error", this._error);
		}
	},
	bufferer: function(buffer) {
		var v = this.video;
		this._buffers.push(buffer);
		this._sourceUpdate();

		if (v.duration != Infinity && !isNaN(v.duration)) {
			if (this._duration == v.duration) {
				this.log("SKIPPED RESET (duration match)");
//				this.log("DURATION MATCH RESET!!!");
//				this.reset();
			}
			this._duration = v.duration;
			var target = v.duration - (CT.stream.opts.chunk / 1000);
			if (v.currentTime <= this._lastTime) {
				this.log("SKIPPED RESET (backtracking)");
//				this.reset();
			}
			this._lastTime = v.currentTime;
			if (!v.paused) {
				if (v.currentTime > target)
					v.playbackRate = 0.5;
				else if (v.currentTime < target - 1)
					v.playbackRate = 2; // v.currentTime = target;
				else
					v.playbackRate = 1;
			}
		}
	},
	process: function(blob) {
		this.recorder && this.recorder.remember(blob);
		CT.stream.util.blob_to_buffer(blob, this.bufferer);
	},
	start: function() {
		var that = this;
		this.log("start (attempting) - paused:", this.video.paused);
		this.video.play().catch(function(error) {
			that.log("play failed! awaiting user input", error.message);
			if (error.message.includes("no supported source"))
				return CT.log("NO SUPPORTED SOURCE!");
			if (CT.stream.opts.requiresInput && !CT.stream.opts.requestedInput) {
				that.audio.node && CT.stream.opts.waiting.push(that.audio.node);
				CT.stream.opts.requestedInput = true;
				(new CT.modal.Prompt({
					cb: CT.stream.opts.startWaiting,
					transition: "fade",
					style: "single-choice",
					data: [ "Play Stream" ],
					prompt: "Ready to stream?"
				})).show();
			}
			CT.data.append(CT.stream.opts.waiting, that.video);
		});
	},
	_miniRecorder: function() {
		var rec = {
			blobs: [],
			remember: function(blob) {
				if (rec.recording)
					rec.blobs.push(blob);
			},
			start: function() {
				rec.recording = true;
			},
			stop: function() {
				rec.recording = false;
			},
			_save: function(blob_or_blobs) {
				CT.file.modal(blob_or_blobs,
					(new Date()).toString().split("-")[0].replace(/\W/g, "") + ".webm");
			},
			save: function() {
				if (CT.stream.opts.transcoder)
					CT.stream.opts.transcoder(rec._save)(new Blob(rec.blobs));
				else
					rec._save(rec.blobs);
				rec.blobs = [];
			}
		};
		return rec;
	},
	save: function() {
		if (this.recorder) { // stop recording
			this._saveButton.firstChild.classList.remove("buttonActive");
			this.recorder.stop();
			this.recorder.save();
			clearTimeout(this._saveTimer);
			delete this._saveTimer;
			delete this.recorder;
		} else {             // start recording
			this._saveButton.firstChild.classList.add("buttonActive");
			this.recorder = this._miniRecorder();
			this.recorder.start();
			this._saveTimer = setTimeout(this.save, CT.stream.opts.cutoff);
		}
	},
	remove: function() {
		var _ = this._;
		this.video.src = "";
		this.audio.remove();
		CT.dom.remove(this.node);
		clearInterval(this._wakey);
		if (_.recorder) {
			_.recorder.state != "inactive" && _.recorder.stop();
			_.recorder._stopped = true;
		}
	},
	_snoozes: 0,
	_wakeup: function() {
		this.log("_wakeup", this.video.currentTime, this.video.duration,
			this.video.paused, this.video.error);
		if (this.video.error) {
			this.log("_wakeup", "error - RESET!");
			return this.reset();
		}
		if (this.video.paused) {
			this.log("_wakeup", "paused - play!");
			return this.start();
		}
		if (this.video._lastct == this.video.currentTime) {
			this.log("_wakeup", "WAKING UP", this.snoozes);
			this.video.currentTime += 1; // help video along....
			this.snoozes += 1;
			if (this.snoozes > CT.stream.opts.snoozes) {
				this.snoozes = 0;
				this.log("overslept - RESET!");
				return this.reset();
			}
		} else
			this.snoozes = 0;
		this.video._lastct = this.video.currentTime;
	},
	_video: function(src) {
		return CT.dom.video(src, this.opts.videoClass,
			this.opts.videoId, this.opts.attrs);
	},
	setVideo: function() {
		this.video = this.opts.video || this._video(this.opts.stream);
		this.video.on("canplay", this.start);
		this.video.on("pause", this.start);
		this.video.on("error", this._error);
	},
	setMediaSource: function() {
		if (this.sourceBuffer) {
			this.sourceBuffer.removeEventListener("updateend", this._sourceUpdate);
			this.sourceBuffer.removeEventListener("error", this._error);
			delete this.sourceBuffer;
		}
		if (this.mediaSource) {
			this.mediaSource.removeEventListener("sourceopen", this._sourceOpen);
			this.mediaSource.removeEventListener("error", this._error);
		}
		this.mediaSource = new MediaSource();
		this.video.src = URL.createObjectURL(this.mediaSource);
		this.mediaSource.addEventListener("sourceopen", this._sourceOpen);
		this.mediaSource.addEventListener("error", this._error);
	},
	fullscreen: function() {
		var v = this.video;
		if (v.requestFullscreen)
			v.requestFullscreen();
		else if (v.webkitRequestFullscreen)
			v.webkitRequestFullscreen();
	},
	switchEncoding: function() {
		var codecs = CT.stream.opts.codecs, oz = this.opts;
		oz.mimeType = (oz.mimeType == codecs.av) ? codecs.video : codecs.av;
		this.log("switching encoding to", oz.mimeType);
	},
	setEncoding: function(mode) {
		var oz = this.opts, prev = oz.mimeType;
		oz.mimeType = CT.stream.opts.modes[mode];
		this.log(mode, "mode:", oz.mimeType);
		if (this.sourceBuffer && oz.mimeType != prev) {
			this.log("mode swap reset!");
			this.reset();
		}
	},
	reset: function() {
		if (!this.video.parentNode) return; //  node is removed -- we're done
		var n = Date.now(), chunk = CT.stream.opts.chunk;
		this.log("resetting!");
		if (this._lastReset) {
			var diff = n - this._lastReset;
			this.log("RESET", diff);
			if (diff < chunk)
				return; // wait
			if (diff < chunk * 8) {
				this.log("calling onreset!");
				this.opts.onreset && this.opts.onreset();
			}
		}
		this._lastReset = n;
		this.refresh();
	},
	refresh: function() {
		this.log("refreshing!");
		this.video.removeEventListener("canplay", this.start);
		this.video.removeEventListener("pause", this.start);
		this.video.removeEventListener("error", this._error);
		this.setVideo();
		this.video.muted = !this.audio.active;
		this.node.insertBefore(this.video, this.node.video);
		CT.dom.remove(this.node.video);
		this.node.video = this.video;
		this.setMediaSource();
		if (this._buffers.length > 10)
			this._buffers.length = 0;
		else
			this._buffers.shift();
		this.requiredInitChunk = this.receivedInitChunk;
		this.opts.onrefresh && this.opts.onrefresh();
	},
	build: function() {
		var opts = this.opts;
		if (opts.stream)
			opts.attrs.srcObject = opts.stream;
		this.setVideo();
		this.audio = new CT.stream.Audio(opts.activeAudio, this);
		this._fullscreenButton = CT.dom.img("/img/fullscreen.png",
			"defpointer hoverglow w80p", this.fullscreen);
		this._saveButton = CT.dom.img("/img/save.png",
			"defpointer hoverglow w80p", this.save);
		this.node = opts.frame ? CT.dom.div([
			this.video,
			CT.dom.div([
				this.audio.button,
				CT.dom.pad(2),
				this._fullscreenButton,
				CT.dom.pad(2),
				this._saveButton
			], "centered")
		], opts.className, opts.id) : CT.dom.div(this.video, opts.className || "fulldef", opts.id);
		this.node.video = this.video;
		var hasRecorder = opts.record[opts.stream ? "streamer" : "lurker"],
			hasFullscreen = opts.fullscreen[opts.stream ? "streamer" : "lurker"];
		if (!opts.frame) {
			var cbl = CT.dom.div(null, "abs cbl");
			if (hasRecorder)
				cbl.appendChild(this._saveButton);
			if (hasFullscreen) {
				if (cbl.childNodes.length)
					cbl.appendChild(CT.dom.pad());
				cbl.appendChild(this._fullscreenButton);
			}
			opts.buttons.forEach(function(b) {
				if (cbl.childNodes.length)
					cbl.appendChild(CT.dom.pad());
				cbl.appendChild(b);
			});
			if (cbl.childNodes.length)
				this.node.appendChild(cbl);
		}
		hasRecorder && opts.record.auto && this.save();
		if (opts.watermark)
			this.node.appendChild(CT.dom.img(opts.watermark, "abs ctr w1-4 mosthigh nofilt"));
		if (opts.stream)
			this.audio.disable();
		else {
			this.setMediaSource();
			this.audio.build();
			if (CT.stream.opts.wakeup)
				this._wakey = setInterval(this._wakeup, CT.stream.opts.wakeup);
		}
		opts.domset && document.body.appendChild(this.node);
	},
	startStream: function() {
		var _ = this._, opts = this.opts, build = this.build,
			vid = this.video = this.opts.video = this.opts.video || this._video();
		CT.stream.util.record(opts.onseg, function(rec, vstream) {
			_.recorder = rec;
			opts.stream = vid.srcObject = vstream;
			build();
		});
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			video: null,
			stream: null,
			className: null,
			id: null,
			frame: true,
			videoClass: null,
			videoId: null,
			watermark: null,
			mimeType: CT.stream.opts.codecs.av,
			activeAudio: false,
			onreset: null,
			buttons: [], // only checked when frame is false
			record: { // recorder always shows when frame is true
				streamer: false,
				lurker: false,
				auto: false
			},
			fullscreen: {
				streamer: false,
				lurker: true
			},
			attrs: {
				autoplay: true
			}
		});
		(opts.stream == "adhoc") ? this.startStream() : this.build();
	}
});