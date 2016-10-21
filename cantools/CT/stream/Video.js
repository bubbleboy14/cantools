CT.stream.Video = CT.Class({
	CLASSNAME: "CT.stream.Video",
	_buffers: [],
	_sourceOpen: function() {
		this.log("sourceopen");
		this.start();
		this.setSourceBuffer();
	},
	_sourceUpdate: function() {
		this.log("_sourceUpdate", this._buffers.length,
			this.node.sourceBuffer.updating, this.node.mediaSource.readyState);
		if (!this.node.sourceBuffer.updating) {
			if (this._buffers.length)
				this.node.sourceBuffer.appendBuffer(this._buffers.shift());
			else if (this.node.mediaSource.readyState == "open") // firefox!?!?
				this.node.mediaSource.endOfStream();
		}
	},
	setSourceBuffer: function() {
		this.log("setSourceBuffer - exists:", !!this.node.sourceBuffer);
		if (!this.node.sourceBuffer) {
			this.node.sourceBuffer = this.node.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
			this.node.sourceBuffer.mode = 'sequence';
			this.node.sourceBuffer.addEventListener("update", this._sourceUpdate);
			this.node.sourceBuffer.addEventListener("updateend", this._sourceUpdate);
		}
	},
	process: function(dataURL) {
		this.log("process", dataURL.length);
		if (!this.node.src) {
			this.node.mediaSource = new MediaSource();
			this.node.src = URL.createObjectURL(this.node.mediaSource);
			this.node.mediaSource.addEventListener("sourceopen", this._sourceOpen);
		}
		var that = this;
		CT.stream.util.b64_to_buffer(dataURL, function(buffer) {
			that._buffers.push(buffer);
			that._sourceUpdate();
		});
	},
	start: function() {
		this.log("start (attempting) - paused:", this.node.paused);
		var that = this, prom = this.node.play();
		prom && prom.then(function() {
			that.log("started!!! streaming!");
		})["catch"](function(error) {
			that.log("play failed! awaiting user input (android)", error.message);
			if (CT.stream.opts.requiresInput && !CT.stream.opts.requestedInput) {
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
	}
});