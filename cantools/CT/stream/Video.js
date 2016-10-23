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
			if (this._video_buffers.length) {
				if (!this.audio.src) // first frame!
					this._nextAudio();
				this.sourceBuffer.appendBuffer(this._video_buffers.shift());
			}
			else if (this.mediaSource.readyState == "open") // firefox!?!?
				this.mediaSource.endOfStream();
		}
	},
	setSourceBuffer: function() {
		this.log("setSourceBuffer - exists:", !!this.sourceBuffer);
		if (!this.sourceBuffer) {
			this.sourceBuffer = this.mediaSource.addSourceBuffer(CT.stream.opts.codecs.video);
			this.sourceBuffer.mode = 'sequence';
			this.sourceBuffer.addEventListener("update", this._sourceUpdate);
//			this.sourceBuffer.addEventListener("updateend", this._sourceUpdate);
		}
	},
	process: function(b64s) {
		this.log("process", b64s.video.length, b64s.audio.length);
		var that = this;
		CT.stream.util.b64_to_buffer(b64s.video, function(videobuffer) {
			that._video_buffers.push(videobuffer);
			that._audio_buffers.push(b64s.audio);
			that._sourceUpdate();
//			if (!that.audio.src) // first frame!
//				that._nextAudio();
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
		this.log("start (attempting) - paused:", this.node.paused);
		var that = this, prom = this.node.play();
		prom && prom.then(function() {
			that.log("started!!! streaming!");
//			that._nextAudio();
		})["catch"](function(error) {
			that.log("play failed! awaiting user input (android)", error.message);
			if (CT.stream.opts.requiresInput && !CT.stream.opts.requestedInput) {
				CT.stream.opts.waiting.push(this.audio);
				CT.stream.opts.requestedInput = true;
				(new CT.modal.Prompt({
					cb: CT.stream.opts.startWaiting,
					transition: "fade",
					style: "single-choice",
					data: [ "Play Stream" ],
					prompt: "Ready to stream?"
				})).show();
			}
			CT.stream.opts.waiting.push(that);
		});
	},
	_nextAudio: function() {
		this.log("NEXT AUDIO!!!!!", this._audio_buffers.length);
		if (this._audio_buffers.length) {
			this.audio.src = this._audio_buffers.shift();
//			if (this.audio.paused)
//				this.audio.play();
		}
	},
//	"audio": function(src, controls, autoplay, preload, onplay, onended, className, id, attrs) {

	_initAudio: function() {
		this.audio = CT.dom.audio(null, null, true,
			null, null, this._nextAudio, "hidden");
//		this.node.addEventListener("play", this._nextAudio);
		document.body.appendChild(this.audio);
	},
	init: function(opts) {
		this.log("init");
		this.opts = opts = CT.merge(opts, {
			video: null,
			stream: null,
			className: null,
			id: null,
			attrs: {
				autoplay: true
			}
		});
		if (opts.stream)
			opts.attrs.mozSrcObject = opts.stream;
		this.node = opts.video || CT.dom.video(opts.stream
			&& URL.createObjectURL(opts.stream), opts.className,
			opts.id, opts.attrs);
		if (!opts.stream) {
			this.mediaSource = new MediaSource();
			this.node.src = URL.createObjectURL(this.mediaSource);
			this.mediaSource.addEventListener("sourceopen", this._sourceOpen);
			this._initAudio();
		}
	}
});