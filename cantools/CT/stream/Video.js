CT.stream.Video = CT.Class({
	CLASSNAME: "CT.stream.Video",
	_buffers: [],
	_lastTime: 0,
	_nextChunk: 0,
	_sourceOpen: function() {
		this.log("sourceopen");
		this.setSourceBuffer();
	},
	_sourceUpdate: function() {
		this.log("_sourceUpdate", this._buffers.length,
			(this.sourceBuffer && this.sourceBuffer.updating), this.mediaSource.readyState);
		if (this.video.error) {
			this.log("ERROR - RESET video");
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
		this.log("setSourceBuffer - exists:", !!this.sourceBuffer);
		if (!this.sourceBuffer) {
			var opts = CT.stream.opts;
			this.sourceBuffer = this.mediaSource.addSourceBuffer(opts.codecs.av);
			this.sourceBuffer.mode = 'sequence';
			this.sourceBuffer.addEventListener("updateend", this._sourceUpdate);
			this.sourceBuffer.addEventListener("error", this._error);
		}
	},
	process: function(blob) {
		var that = this, v = this.video;
		this.recorder && this.recorder.remember(blob);
		CT.stream.util.blob_to_buffer(blob, function(buffer) {
			that._buffers.push(buffer);
			that._sourceUpdate();
			var target = v.duration - (CT.stream.opts.chunk / 1000);
			if (v.currentTime < that._lastTime) {
				that.log("RESET (backtracking)");
				that.reset();
			}
			that._lastTime = v.currentTime;
			if (!v.paused && v.currentTime < target)
				v.currentTime = target;
		});
	},
	start: function() {
		this.log("start (attempting) - paused:", this.video.paused);
		var that = this, prom = this.video.play();
		prom && prom.then(function() {
			that.log("started!!! streaming!");
		})["catch"](function(error) {
			that.log("play failed! awaiting user input (android)", error.message);
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
			CT.stream.opts.waiting.push(that.video);
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
				var fname = (new Date()).toString().split("-")[0].replace(/\W/g, "") + ".webm",
					ctf = CT.file.make(blob_or_blobs);
				(new CT.modal.Modal({
					content: [
						CT.dom.div("Your file is ready for download!", "bigger pb10"),
						ctf.download(fname, "click me!", "bold centered block")
					]
				})).show();
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
		this.video.src = "";
		CT.dom.remove(this.node);
		this.audio.remove();
	},
	_wakeup: function() {
		if (this.video._lastct == this.video.currentTime)
			this.video.currentTime += 1; // help video along....
		this.video._lastct = this.video.currentTime;
	},
	setVideo: function() {
		this.video = this.opts.video || CT.dom.video(this.opts.stream
			&& URL.createObjectURL(this.opts.stream), this.opts.videoClass,
			this.opts.videoId, this.opts.attrs);
		this.video.on("canplay", this.start);
		this.video.on("pause", this.start);
		this.video.on("error", this._error);
	},
	setMediaSource: function() {
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
	reset: function() {
		var n = Date.now();
		if (this._lastReset) {
			var diff = n - this._lastReset;
			this.log("RESET", diff);
			if (diff < CT.stream.opts.chunk / 2)
				return; // wait
			this.opts.onreset && this.opts.onreset();
		}
		this._lastReset = n;
		this.video.removeEventListener("canplay", this.start);
		this.video.removeEventListener("pause", this.start);
		this.video.removeEventListener("error", this._error);
		this.setVideo();
		this.video.muted = !this.audio.active;
		this.node.insertBefore(this.video, this.node.video);
		CT.dom.remove(this.node.video);
		this.node.video = this.video;
		this.sourceBuffer.removeEventListener("updateend", this._sourceUpdate);
		this.sourceBuffer.removeEventListener("error", this._error);
		delete this.sourceBuffer;
		this.mediaSource.removeEventListener("sourceopen", this._sourceOpen);
		this.mediaSource.removeEventListener("error", this._error);
		this.setMediaSource();
		this._buffers.shift();
		this.requiredInitChunk = this.receivedInitChunk;
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
		if (opts.stream)
			opts.attrs.mozSrcObject = opts.stream;
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
			setInterval(this._wakeup, 1000);
		}
	}
});