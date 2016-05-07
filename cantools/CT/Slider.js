/*
This class is used to generate a slider, which is a segmented,
directionally-constrained draggable DOM element.

The constructor takes an options object, 'opts', which may define
any of several properties. These individual properties, as well as
the 'opts' object itself, are all optional.

### Definable properties are as follows:
    - node (default: document.body): DOM element in which to build the slider
    - autoSlideInterval (default: 5000): how many milliseconds to wait before auto-sliding cards
    - bubblePosition (default: 'bottom'): where to position card indicator bubbles ('top' or 'bottom')
    - arrowPosition (default: 'middle'): where to position navigator arrows
    - orientation (default: "horizontal"): orientation for slider cards to arrange themselves
    - cards (default: []): an array of items corresponding to the cards in the slider

The last one, 'cards', must be an array either of strings (interpreted
as image urls) or of data objects (processed in the addFrame function).
*/

CT.Slider = CT.Class({
	CLASSNAME: "CT.Slider",
	_dir2abs: { right: "forward", left: "backward", down: "forward", up: "backward" },
	_other_dim: { height: "width", width: "height" },
	_other_orientation: { vertical: "horizontal", horizontal: "vertical" },
	_orientation2dim: { vertical: "height", horizontal: "width" },
	_orientation2axis: { vertical: "y", horizontal: "x" },
	init: function (opts) {
		this.opts = opts = CT.merge(opts, {
			node: document.body,
			autoSlideInterval: 5000,
			cards: [],
			orientation: "horizontal",
			arrowPosition: "middle", // or "top" or "middle"
			bubblePosition: "bottom" // or "top"
		});
		this.dimension = this._orientation2dim[opts.orientation];
		this.circlesContainer = CT.dom.node("", "div",
			"carousel-order-indicator " + opts.bubblePosition);
		this.prevButton = CT.dom.node(CT.dom.node("<", "span"), "div",
			"slider-btn prv hidden sb-" + this.opts.arrowPosition);
		this.nextButton = CT.dom.node(CT.dom.node(">", "span"), "div",
			"slider-btn nxt sb-" + this.opts.arrowPosition);
		this.index = this.pos = 0;
		this.width = CT.align.width(this.opts.node);
		this.height = CT.align.height(this.opts.node);
		this.full = this.opts.cards.length * this[this.dimension];
		var cstyle = {};
		cstyle[this._orientation2dim[opts.orientation]] = this.full + "px";
		this.container = CT.dom.node("", "div",
			"carousel-container full" + this._other_dim[this.dimension],
			null, null, cstyle);
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
		this.dragOpts = {
			constraint: this._other_orientation[opts.orientation],
			interval: this[this.dimension],
			up: this.updatePosition
		};
		CT.drag.makeDraggable(this.container, this.dragOpts);
		this._autoSlide = setInterval(this._autoSlideCallback, this.opts.autoSlideInterval);
		CT.gesture.listen("down", this.container, this._clearAutoSlide);
		this.opts.node.onresize = this._resize;
	},
	_resize_frame: function(n) {
		n.style[this.dimension] = this[this.dimension] + "px";
	},
	_resize: function() {
		var dim = this.dimension,
			v = this[dim] = CT.align[dim](this.opts.node);
		this.height = CT.align.height(this.opts.node);
		this.full = this.opts.cards.length * v;
		this.dragOpts.interval = v;
		this.container.style[dim] = this.full + "px";
		this.container.parentNode.style.width = this.width + "px";
		this.container.parentNode.style.height = this.height + "px";
		CT.dom.each(this.container, this._resize_frame);
	},
	_clearAutoSlide: function () {
		if (this._autoSlide) {
			clearInterval(this._autoSlide);
			this._autoSlide = null;
		}
	},
	addFrame: function (card, index) {
		if (typeof card == "string")
			card = { img: card };
		var circle = CT.dom.node(card.label, "div",
			"indicator-circle " + (card.label ? "labeled" : "unlabeled") + "-circle");
		CT.gesture.listen("tap", circle, this.circleJump(index));
		if (index == 0) {
			circle.className += " active-circle";
			this.activeCircle = circle;
		}
		this.circlesContainer.appendChild(circle);
		var full = CT.dom.node(card.content, "div", "big carousel-content-full");
		CT.drag.makeDraggable(full, { constraint: "horizontal" });
		var nodes = [
			CT.dom.node(null, "div", "carousel-content-image", null,
				null, { backgroundImage: "url(" + card.img + ")" }),
			full
		];
		if (card.title || card.blurb) {
			nodes.push(CT.dom.node([
				CT.dom.node(card.title, "div", "biggest"),
				CT.dom.node(card.blurb, "div", "bigger")
			], "div", "carousel-content-teaser pointer"));
		}
		var node = CT.dom.node(nodes, "div",
			"carousel-content-container full" + this._other_dim[this.dimension]);
		if (this.dimension == "width")
			node.style.display = "inline-block";
		this._resize_frame(node);
		if (card.content) { // assume title/blurb exists
			var clearAS = this._clearAutoSlide;
			CT.gesture.listen("tap", node.firstChild.nextSibling.nextSibling, function() {
				clearAS();
				node._retracted = !node._retracted;
				if (node._retracted) {
					node.firstChild.classList.add("carousel-retracted");
					CT.trans.trans({
						cb: function() {
							full.style.zIndex = 100;
						}
					});
				} else {
					full.style.zIndex = -1;
					node.firstChild.classList.remove("carousel-retracted");
				}
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
		var index = this.index, absdir = this._dir2abs[direction];
		if (absdir == "backward" && (force || this.activeCircle.nextSibling))
			index += 1;
		else if (absdir == "forward" && (force || this.activeCircle.previousSibling))
			index -= 1;
		this.slide(index % this.circlesContainer.childNodes.length);
	},
	trans: function() {
		var opts = {};
		opts[this._orientation2axis[this.opts.orientation]] = -this.index * this[this.dimension];
		CT.trans.translate(this.container, opts);
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