CT.stream.Audio = CT.Class({
	CLASSNAME: "CT.stream.Audio",
	_buffers: [],
	_flip: function() {
		this.active = !this.active;
		if (!this.active && this.node)
			this.node.src = null;
		this.button.firstChild.classList[this.active ? "add" : "remove"]("buttonActive");
	},
	push: function(buff) {
		this._buffers.push(buff);
	},
	next: function() {
		var buff = this._buffers.shift();
		if (buff && this.active && !CT.stream.opts.merged) {
			this.node.src = buff;
			this.play();
		}
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
			active && "buttonActive", this._flip);
	}
});