CT.Slider = CT.Class({
	CLASSNAME: "CT.Slider",
	init: function (opts) {
		this.opts = CT.merge(opts, {
			node: document.body,
			cards: []
		});
		this.circlesContainer = CT.dom.node("", "div", "carousel-order-indicator");
		this.prevButton = CT.dom.node("<", "div", "slider-btn prv hidden");
		this.nextButton = CT.dom.node(">", "div", "slider-btn nxt");
		this.pos = 0;
		this.width = CT.align.width(this.opts.node);
		this.height = CT.align.height(this.opts.node);
		this.fullWidth = this.opts.cards.length * this.width;
		this.container = CT.dom.node("", "div", "carousel-container", null,
			null, { width: this.fullWidth + "px" });
		this.opts.node.appendChild(CT.dom.node([
			this.container,
			this.circlesContainer,
			this.prevButton,
			this.nextButton
		], "div", "carousel", null, null, {
			width: this.width + "px",
			height: this.height + "px"
		}));
		this.opts.cards.forEach(this.addFrame);
		CT.gesture.listen("tap", this.prevButton, this.prevButtonCallback);
		CT.gesture.listen("tap", this.nextButton, this.nextButtonCallback);
		CT.drag.makeDraggable(this.container, {
			constraint: "vertical",
			interval: this.width, 
			up: this.updatePosition
		});
	},
	addFrame: function(imgsrc, index) {
		var circle = CT.dom.node("", "div", "indicator-circle");
		if (index == 0) {
			circle.className += " active-circle";
			this.activeCircle = circle;
		}
		this.circlesContainer.appendChild(circle);
		this.container.appendChild(CT.dom.node(CT.dom.img(imgsrc), "div",
			"carousel-image-container", null, null, { width: this.width + "px" }));
	},
	updatePosition: function (direction) {
		this.activeCircle.classList.remove('active-circle');
		if (direction == "first")
			this.activeCircle = this.circlesContainer.firstChild;
		else if (direction == "last")
			this.activeCircle = this.circlesContainer.lastChild;
		else if (direction == "left" && this.activeCircle.nextSibling)
			this.activeCircle = this.activeCircle.nextSibling;
		else if (direction == "right" && this.activeCircle.previousSibling)
			this.activeCircle = this.activeCircle.previousSibling;
		this.activeCircle.classList.add('active-circle');
		CT.dom[this.activeCircle.nextSibling ? "show" : "hide"](this.nextButton);
		CT.dom[this.activeCircle.previousSibling ? "show" : "hide"](this.prevButton);
	},
	shift: function (direction) {
		if (direction == "right")
			this.pos += this.width;
		else if (direction == "left")
			this.pos -= this.width;
		if (this.pos == -this.fullWidth) {
			this.pos = 0;
			direction = "first";
		} else if (this.pos == this.width) {
			this.pos = this.width - this.fullWidth;
			direction = "last";
		}
		this.updatePosition(direction);
		CT.trans.translate(this.container, {
			x: this.pos
		});
	},
	prevButtonCallback: function () {
		this.shift("right");
	},
	nextButtonCallback: function () {
		this.shift("left");
	}
});