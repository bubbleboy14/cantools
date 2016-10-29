CT.stream.Video = CT.Class({
	CLASSNAME: "CT.stream.Video",
	_video_buffers: [],
	_audio_buffers: [],
	_sourceOpen: function() {
		this.log("sourceopen");
		this.start();
		this.setSourceBuffer();
	},
	_sourceUpdate: function() {
		this.log("_sourceUpdate", this._video_buffers.length,
			this.sourceBuffer.updating, this.mediaSource.readyState);
		if (!this.sourceBuffer.updating) {
			if (this._video_buffers.length)
				this.sourceBuffer.appendBuffer(this._video_buffers.shift());
			else if (this.mediaSource.readyState == "open") {
				this._nextAudio();
				this.mediaSource.endOfStream();
			}
		}
	},
	setSourceBuffer: function() {
		this.log("setSourceBuffer - exists:", !!this.sourceBuffer);
		if (!this.sourceBuffer) {
			this.sourceBuffer = this.mediaSource.addSourceBuffer(CT.stream.opts.codecs.video);
			this.sourceBuffer.mode = 'sequence';
			this.sourceBuffer.addEventListener("update", this._sourceUpdate);
		}
	},
	process: function(b64s) {
		this.log("process", b64s.video.length,
			b64s.audio && b64s.audio.length);
		var that = this;
		CT.stream.util.b64_to_buffer(b64s.video, function(videobuffer) {
			that._audio_buffers.push(b64s.audio);
			that._video_buffers.push(videobuffer);
			that._sourceUpdate();
		});
	},
	process_single: function(dataURL) { // video only, or working av feed :-\
		this.log("process", dataURL.length);
		var that = this;
		CT.stream.util.b64_to_buffer(dataURL, function(buffer) {
			that._video_buffers.push(buffer);
			that._sourceUpdate();
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
				that.audio && CT.stream.opts.waiting.push(that.audio);
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
	_nextAudio: function() {
		this.log("NEXT AUDIO!!!!!", this._audio_buffers.length, this.activeAudio);
		if (this._audio_buffers.length > this._video_buffers.length) {
			var buff = this._audio_buffers.shift();
			this.audio.src = this.activeAudio ? buff : "";
			if (this.audio.src && this.audio.paused)
				this.audio.play();
		}
	},
	_initAudio: function() {
		this.activeAudio = this.opts.activeAudio;
		this.audio = CT.dom.audio(null, null, true,
			null, null, null, "hidden");
//			null, null, this._nextAudio, "hidden");
		document.body.appendChild(this.audio);
	},
	_flipAudio: function() {
		this.activeAudio = !this.activeAudio;
		this._audioButton.firstChild.classList[this.activeAudio ? "add" : "remove"]("buttonActive");
	},
	init: function(opts) {
		this.log("init");
		this.opts = opts = CT.merge(opts, {
			video: null,
			stream: null,
			className: null,
			id: null,
			videoClass: null,
			videoId: null,
			activeAudio: true,
			attrs: {
				autoplay: true
			}
		});
		if (opts.stream)
			opts.attrs.mozSrcObject = opts.stream;
		this.video = opts.video || CT.dom.video(opts.stream
			&& URL.createObjectURL(opts.stream), opts.videoClass,
			opts.videoId, opts.attrs);
		this._audioButton = CT.dom.img("/img/audio.png",
			opts.activeAudio && "buttonActive", this._flipAudio);
		this.node = CT.dom.div([
			this.video,
			CT.dom.div([
				this._audioButton,
				CT.dom.pad(2),
				CT.dom.img("/img/save.png")
			], "centered")
		], opts.className, opts.id);
		this.node.video = this.video;
		if (opts.stream)
			this.video.volume = 0;
		else {
			this.mediaSource = new MediaSource();
			this.video.src = URL.createObjectURL(this.mediaSource);
			this.mediaSource.addEventListener("sourceopen", this._sourceOpen);
			this._initAudio();
		}
	}
});