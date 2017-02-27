CT.stream.Audio = CT.Class({
	CLASSNAME: "CT.stream.Audio",
	_buffers: [],
	_flip: function() {
		this.active = !this.active;
		this.button.firstChild.classList[this.active ? "add" : "remove"]("buttonActive");
	},
	push: function(buff) {
		this._buffers.push(buff);
	},
	next: function() {
		this.log("NEXT AUDIO!!!!!", this._buffers.length, this.active);
		if (this._buffers.length > this.video._buffers.length + CT.stream.opts.audioDelay) {
			var buff = this._buffers.shift();
			if (this.active && !CT.stream.opts.merged) {
				this.node.pause();
				this.node.src = buff;
				this.node.play();
			}
		}
	},
	build: function() {
		this.node = CT.dom.audio(null, null,
			null, null, null, null, "hidden");
		document.body.appendChild(this.node);
	},
	init: function(active, video) {
		this.active = active;
		this.video = video;
		this.button = CT.dom.img("/img/audio.png",
			active && "buttonActive", this._flip);
	}
});