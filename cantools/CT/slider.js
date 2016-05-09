/*
This class is used to generate a slider, which is a segmented,
directionally-constrained draggable DOM element.

The CT.slider.Slider constructor takes an options object, 'opts', which may
define any of several properties. These individual properties, as well as
the 'opts' object itself, are all optional.

### Definable properties are as follows:
    - node (default: document.body): DOM element in which to build the slider
    - mode (dfault: 'peekaboo'): how to display each frame - 'peekaboo' or 'chunk'
    - autoSlideInterval (default: 5000): how many milliseconds to wait before auto-sliding frames
    - clearParentAutoSlide (default: null): used by chunked (or custom) Frame to cancel parent autoslide
    - bubblePosition (default: 'bottom'): where to position frame indicator bubbles ('top' or 'bottom')
    - arrowPosition (default: 'middle'): where to position navigator arrows
    - orientation (default: 'horizontal'): orientation for slider frames to arrange themselves
    - frames (default: []): an array of items corresponding to the frames in the slider

The last one, 'frames', must be an array either of strings (interpreted
as image urls) or of data objects (processed in the addFrame function).
*/

CT.slider = {
	dir2abs: { right: "forward", left: "backward", down: "forward", up: "backward" },
	other_dim: { height: "width", width: "height" },
	other_orientation: { vertical: "horizontal", horizontal: "vertical" },
	orientation2dim: { vertical: "height", horizontal: "width" },
	orientation2axis: { vertical: "y", horizontal: "x" }
};

CT.slider.Slider = CT.Class({
	CLASSNAME: "CT.slider.Slider",
	init: function (opts) {
		this.opts = opts = CT.merge(opts, {
			frames: [],
			autoSlideInterval: 5000,
			clearParentAutoSlide: null,
			node: document.body,
			mode: "peekaboo", // or 'chunk'
			orientation: "horizontal",
			arrowPosition: "middle", // or "top" or "middle"
			bubblePosition: "bottom" // or "top"
		});
		this.dimension = CT.slider.orientation2dim[opts.orientation];
		this.circlesContainer = CT.dom.node("", "div",
			"carousel-order-indicator " + opts.bubblePosition);
		this.prevButton = CT.dom.node(CT.dom.node("<", "span"), "div",
			"slider-btn prv hidden sb-" + this.opts.arrowPosition);
		this.nextButton = CT.dom.node(CT.dom.node(">", "span"), "div",
			"slider-btn nxt sb-" + this.opts.arrowPosition);
		this.index = this.pos = 0;
		this.container = CT.dom.node("", "div",
			"carousel-container full" + CT.slider.other_dim[this.dimension]);
		this.opts.node.appendChild(CT.dom.node([
			this.container,
			this.circlesContainer,
			this.prevButton,
			this.nextButton
		], "div", "carousel fullwidth fullheight"));
		this.opts.frames.forEach(this.addFrame);
		CT.gesture.listen("tap", this.prevButton, this.prevButtonCallback);
		CT.gesture.listen("tap", this.nextButton, this.nextButtonCallback);
		this.dragOpts = {
			constraint: CT.slider.other_orientation[opts.orientation],
			up: this.updatePosition,
			interval: "auto"
		};
		CT.drag.makeDraggable(this.container, this.dragOpts);
		if (this.opts.autoSlideInterval)
			this._autoSlide = setInterval(this._autoSlideCallback, this.opts.autoSlideInterval);
		CT.gesture.listen("down", this.container, this.clearAutoSlide);
		this._reflow();
	},
	_reflow: function() {
		CT.dom.mod({
			targets: this.container.childNodes,
			property: this.dimension,
			value: (100 / this.container.childNodes.length) + "%"
		});
		this.container.style[this.dimension] = (this.opts.frames.length * 100) + "%";
	},
	clearAutoSlide: function () {
		if (this._autoSlide) {
			clearInterval(this._autoSlide);
			this._autoSlide = null;
		}
		this.opts.clearParentAutoSlide && this.opts.clearParentAutoSlide();
	},
	addFrame: function (frame, index) {
		if (typeof frame == "string")
			frame = { img: frame };
		var circle = CT.dom.node(frame.label, "div",
			"indicator-circle " + (frame.label ? "labeled" : "unlabeled") + "-circle");
		CT.gesture.listen("tap", circle, this.circleJump(index));
		if (index == 0) {
			circle.className += " active-circle";
			this.activeCircle = circle;
		}
		this.circlesContainer.appendChild(circle);
		this.container.appendChild((new CT.slider.Frame(frame, this)).node);
		if (index == undefined) // ad-hoc frame
			this._reflow();
	},
	circleJump: function (index) {
		var f = function() {
			this.clearAutoSlide();
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
		var index = this.index, absdir = CT.slider.dir2abs[direction];
		if (absdir == "backward" && (force || this.activeCircle.nextSibling))
			index += 1;
		else if (absdir == "forward" && (force || this.activeCircle.previousSibling))
			index -= 1;
		this.slide(index % this.circlesContainer.childNodes.length);
	},
	trans: function() {
		var opts = {};
		opts[CT.slider.orientation2axis[this.opts.orientation]] = -this.index
			* CT.align[this.dimension](this.container) / this.container.childNodes.length;
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
		this.clearAutoSlide();
		this.shift("right");
	},
	nextButtonCallback: function () {
		this.clearAutoSlide();
		this.shift("left");
	}
});

CT.slider.Frame = CT.Class({
	CLASSNAME: "CT.slider.Frame",
	peekaboo: function() {
		var opts = this.opts, node = this.node,
			full = CT.dom.node(opts.content, "div", "big carousel-content-full"),
			nodes = [
				CT.dom.node(null, "div", "carousel-content-image", null,
					null, { backgroundImage: "url(" + opts.img + ")" }),
				full
			];
		CT.drag.makeDraggable(full, { constraint: "horizontal" });
		if (opts.title || opts.blurb) {
			nodes.push(CT.dom.node([
				CT.dom.node(opts.title, "div", "biggest"),
				CT.dom.node(opts.blurb, "div", "bigger")
			], "div", "carousel-content-teaser pointer"));
		}
		CT.dom.addEach(node, nodes);
		if (opts.content) { // assume title/blurb exists
			var clearAS = this.slider.clearAutoSlide;
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
	},
	chunk: function() {
		new CT.slider.Slider({
			node: this.node,
			frames: this.opts.frames,
			autoSlideInterval: null,
			orientation: CT.slider.other_orientation[this.slider.opts.orientation],
			clearParentAutoSlide: this.slider.clearAutoSlide,
			arrowPosition: "bottom"
		});
	},
	init: function(opts, slider) {
		this.opts = opts;
		this.slider = slider;
		this.node = CT.dom.node("", "div",
			"carousel-content-container full" + CT.slider.other_dim[slider.dimension]);
		if (slider.dimension == "width")
			this.node.style.display = "inline-block";
		this[slider.opts.mode]();
	}
});