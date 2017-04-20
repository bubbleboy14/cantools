CT.stream.Audio = CT.Class({
	CLASSNAME: "CT.stream.Audio",
	_buffers: [],
	_flip: function() {
		if (this.disabled) return;
		this.active = !this.active;
		this.video.video.muted = !this.active;
		this.button.firstChild.classList[this.active ? "add" : "remove"]("buttonActive");
	},
	push: function(buff) {
		this._buffers.push(buff);
	},
	build: function() {
		this.node = CT.dom.audio({
			className: "hidden",
			onpause: this.play
		});
		document.body.appendChild(this.node);
	},
	remove: function() {
		CT.dom.remove(this.node);
	},
	disable: function() {
		this.active = false;
		this.disabled = true;
		this.video.video.muted = true;
	},
	play: function() {
		var that = this;
		this.node.play()["catch"](function(err) {
			that.log("play error (but we don't carerror!)", err.msg);
		});
	},
	init: function(active, video) {
		this.active = active;
		this.video = video;
		this.button = CT.dom.img("/img/audio.png",
			"w80p" + (active && " buttonActive" || ""), this._flip);
		if (!active)
			video.video.muted = true;
	}
});