CT.stream.Video = CT.Class({
	CLASSNAME: "CT.stream.Video",
	_buffers: [],
	_sourceOpen: function() {
		this.log("sourceopen");
		this.setSourceBuffer();
	},
	_sourceUpdate: function() {
		this.log("_sourceUpdate", this._buffers.length,
			this.sourceBuffer.updating, this.mediaSource.readyState);
		if (!this.sourceBuffer.updating) {
			if (this._buffers.length)
				this.sourceBuffer.appendBuffer(this._buffers.shift());
			else if (this.mediaSource.readyState == "open") {
				this.mediaSource.endOfStream();
				!this.audio.canplay && this.audio.next();
			}
		}
	},
	setSourceBuffer: function() {
		this.log("setSourceBuffer - exists:", !!this.sourceBuffer);
		if (!this.sourceBuffer) {
			var opts = CT.stream.opts;
			this.sourceBuffer = this.mediaSource.addSourceBuffer(opts.merged
				? opts.codecs.av : opts.codecs.video);
			this.sourceBuffer.mode = 'sequence';
			this.sourceBuffer.addEventListener("updateend", this._sourceUpdate);
		}
	},
	process: function(b64s) {
		if (CT.stream.opts.merged)
			return this.process_single(b64s);
		this.log("process", b64s.video.length,
			b64s.audio && b64s.audio.length);
		var that = this;
		CT.stream.util.b64_to_blob(b64s.video, function(videoblob) {
			that.recorder && that.recorder.remember
				&& that.recorder.remember(videoblob);
			CT.stream.util.blob_to_buffer(videoblob, function(videobuffer) {
				that.audio.push(b64s.audio);
				that._buffers.push(videobuffer);
				that._sourceUpdate();
			});
		});
	},
	process_single: function(dataURL) { // video only, or working av feed :-\
		this.log("process", dataURL.length);
		var that = this;
		CT.stream.util.b64_to_buffer(dataURL, function(buffer) {
			that._buffers.push(buffer);
			that._sourceUpdate();
		});
	},
	start: function() {
		this.canplay = true;
		if (CT.stream.opts.merged || !this.audio.active || this.audio.canplay)
			this._start();
	},
	_start: function() {
		this.log("start (attempting) - paused:", this.video.paused);
		var that = this, prom = this.video.play();
		prom && prom.then(function() {
			that.log("started!!! streaming!");
			that.audio.node.play();
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
			save: function() {
				ConcatenateBlobs(rec.blobs, rec.blobs[0].type,
					invokeSaveAsDialog);
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
			this.recorder = this.opts.stream
				? CT.stream.util.videoRecorder(this.opts.stream)
				: this._miniRecorder();
			this.recorder.start();
			this._saveTimer = setTimeout(this.save, CT.stream.opts.cutoff);
		}
	},
	remove: function() {
		CT.dom.remove(this.node);
		this.audio.remove();
	},
	init: function(opts) {
		this.log("init");
		this.opts = opts = CT.merge(opts, {
			video: null,
			stream: null,
			className: null,
			id: null,
			frame: true,
			videoClass: null,
			videoId: null,
			activeAudio: false,
			attrs: {
				autoplay: true
			}
		});
		if (opts.stream)
			opts.attrs.mozSrcObject = opts.stream;
		this.video = opts.video || CT.dom.video(opts.stream
			&& URL.createObjectURL(opts.stream), opts.videoClass,
			opts.videoId, opts.attrs);
		this.video.on("canplay", this.start);
		this.video.on("pause", this._start);
		this.audio = new CT.stream.Audio(opts.activeAudio, this);
		this._saveButton = CT.dom.img("/img/save.png", null, this.save);
		this.node = opts.frame ? CT.dom.div([
			this.video,
			CT.dom.div([
				this.audio.button,
				CT.dom.pad(2),
				this._saveButton
			], "centered")
		], opts.className, opts.id) : this.video;
		this.node.video = this.video;
		if (opts.stream)
			this.video.volume = 0;
		else {
			this.mediaSource = new MediaSource();
			this.video.src = URL.createObjectURL(this.mediaSource);
			this.mediaSource.addEventListener("sourceopen", this._sourceOpen);
			this.audio.build();
		}
	}
});