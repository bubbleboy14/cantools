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
		this.log("NEXT AUDIO!!!!!", this._buffers.length, this.video._buffers.length, this.active);
		var buff = this._buffers.shift();
		if (buff && this.active && !CT.stream.opts.merged) {
			this.node.src = buff;
			this.canplay && this.node.play();
		}
	},
	start: function() {
		this.canplay = true;
		if (this.video.canplay)
			this.video.start();
	},
	build: function() {
		var n = this.node = CT.dom.audio({
			className: "hidden",
			onended: this.next,
			oncanplay: this.start,
			onpause: function() { n.play(); }
		});
		document.body.appendChild(this.node);
	},
	init: function(active, video) {
		this.active = active;
		this.video = video;
		this.button = CT.dom.img("/img/audio.png",
			active && "buttonActive", this._flip);
	}
});