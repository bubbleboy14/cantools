CT.Slider = CT.Class({
	CLASSNAME: "CT.Slider",
	init: function (opts) {
		this.opts = opts = CT.merge(opts, {
			node: document.body,
			autoSlideInterval: 5000,
			cards: [],
			bubblePosition: "bottom" // or "top"
		});
		this.circlesContainer = CT.dom.node("", "div",
			"carousel-order-indicator " + opts.bubblePosition);
		this.prevButton = CT.dom.node("<", "div", "slider-btn prv hidden");
		this.nextButton = CT.dom.node(">", "div", "slider-btn nxt");
		this.index = this.pos = 0;
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
		this._autoSlide = setInterval(this._autoSlideCallback, this.opts.autoSlideInterval);
		CT.gesture.listen("down", this.container, this._clearAutoSlide);
	},
	_clearAutoSlide: function () {
		if (this._autoSlide) {
			clearInterval(this._autoSlide);
			this._autoSlide = null;
		}
	},
	addFrame: function (card, index) {
		if (typeof card == "string")
			card = { img: card }
		var circle = CT.dom.node(card.label, "div",
			"indicator-circle " + (card.label ? "labeled" : "unlabeled") + "-circle");
		CT.gesture.listen("tap", circle, this.circleJump(index));
		if (index == 0) {
			circle.className += " active-circle";
			this.activeCircle = circle;
		}
		this.circlesContainer.appendChild(circle);
		var nodes = [
			CT.dom.node(null, "div", "carousel-content-image", null,
				null, { backgroundImage: "url(" + card.img + ")" }),
			CT.dom.node(card.content, "div", "big carousel-content-full")
		];
		if (card.title || card.blurb) {
			nodes.push(CT.dom.node([
				CT.dom.node(card.title, "div", "biggest"),
				CT.dom.node(card.blurb, "div", "bigger")
			], "div", "carousel-content-teaser"));
		}
		var node = CT.dom.node(nodes, "div", "carousel-content-container",
			null, null, { width: this.width + "px" });
		if (card.content) {
			var clearAS = this._clearAutoSlide;
			CT.gesture.listen("tap", node, function() {
				clearAS();
				node._retracted = !node._retracted;
				if (node._retracted)
					node.firstChild.classList.add("carousel-retracted");
				else
					node.firstChild.classList.remove("carousel-retracted");
			});
		}
		this.container.appendChild(node);
	},
	circleJump: function (index) {
		var f = function() {
			this._clearAutoSlide();
			this.slide(index);
			this.trans();
		}.bind(this);
		return f;
	},
	slide: function (index) {
		this.index = index;
		this.activeCircle.classList.remove('active-circle');
		this.activeCircle = this.circlesContainer.childNodes[index];
		this.activeCircle.classList.add('active-circle');
		CT.dom[this.activeCircle.nextSibling ? "show" : "hide"](this.nextButton);
		CT.dom[this.activeCircle.previousSibling ? "show" : "hide"](this.prevButton);
	},
	updatePosition: function (direction, force) {
		var index = this.index;
		if (direction == "left" && (force || this.activeCircle.nextSibling))
			index += 1;
		else if (direction == "right" && (force || this.activeCircle.previousSibling))
			index -= 1;
		this.slide(index % this.circlesContainer.childNodes.length);
	},
	trans: function() {
		CT.trans.translate(this.container, {
			x: -this.index * this.width
		});
	},
	shift: function (direction, force) {
		this.updatePosition(direction, force);
		this.trans();
	},
	_autoSlideCallback: function () {
		this.shift("left", true);
	},
	prevButtonCallback: function () {
		this._clearAutoSlide();
		this.shift("right");
	},
	nextButtonCallback: function () {
		this._clearAutoSlide();
		this.shift("left");
	}
});