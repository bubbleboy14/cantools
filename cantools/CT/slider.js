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
    - autoSlide (default: true): automatically proceed through frames (else, trigger later with .resume())
    - pan (default: true): slow-pan frame background images
    - pauseParent (default: null): used by chunked (or custom) Frame to pause parent autoslide
    - bubblePosition (default: 'bottom'): where to position frame indicator bubbles ('top' or 'bottom')
    - arrowPosition (default: 'middle'): where to position navigator arrows
    - orientation (default: 'horizontal'): orientation for slider frames to arrange themselves
    - frames (default: []): an array of items corresponding to the frames in the slider

The last one, 'frames', must be an array either of strings (interpreted
as image urls) or of data objects (processed in the addFrame function).
*/

CT.slider = {
	dir2abs: { right: "backward", left: "forward", up: "forward", down: "backward" },
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
			autoSlide: true,
			pan: true,
			pauseParent: null,
			node: document.body,
			mode: "peekaboo", // or 'chunk'
			orientation: "horizontal",
			arrowPosition: "middle", // or "top" or "middle"
			bubblePosition: "bottom" // or "top"
		});
		this.dimension = CT.slider.orientation2dim[opts.orientation];
		this.circlesContainer = CT.dom.node("", "div",
			"carousel-order-indicator " + opts.bubblePosition);

		var bclass = "slider-btn hoverglow pointer sb-"
			+ this.opts.arrowPosition + " sb-" + opts.orientation;

		this.prevButton = CT.dom.node(CT.dom.node("<", "span"), "div",
			bclass + " prv hidden");
		this.nextButton = CT.dom.node(CT.dom.node(">", "span"), "div",
			bclass + " nxt");
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
		if (this.opts.autoSlideInterval && this.opts.autoSlide)
			this.resume();
		CT.gesture.listen("down", this.container, this.pause);
		this.opts.node.onresize = this.trans;
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
	resume: function() {
		if (!this._autoSlide)
			this._autoSlide = setInterval(this._autoSlideCallback, this.opts.autoSlideInterval);
	},
	pause: function () {
		if (this._autoSlide) {
			clearInterval(this._autoSlide);
			this._autoSlide = null;
		}
		this.opts.pauseParent && this.opts.pauseParent();
	},
	addFrame: function (frame, index) {
		if (typeof frame == "string")
			frame = { img: frame };
		var circle = CT.dom.node(frame.label, "div",
			"hoverglow pointer indicator-circle " + (frame.label ? "labeled" : "unlabeled") + "-circle");
		CT.gesture.listen("tap", circle, this.circleJump(index));
		this.circlesContainer.appendChild(circle);
		this.container.appendChild((new CT.slider.Frame(frame, this)).node);
		if (index == 0) {
			circle.className += " active-circle";
			this.activeCircle = circle;
			if (!this.opts.pauseParent) // exclude embedded slider
				setTimeout(this.container.firstChild.frame.on.show, 500);
		}
		if (index == undefined) // ad-hoc frame
			this._reflow();
	},
	circleJump: function (index) {
		var f = function() {
			this.pause();
			this.updateIndicator(index);
			this.trans();
		}.bind(this);
		return f;
	},
	updateIndicator: function (index) {
		this.container.childNodes[this.index].frame.on.hide();
		this.index = index;
		this.container.childNodes[this.index].frame.on.show();
		this.activeCircle.classList.remove('active-circle');
		this.activeCircle = this.circlesContainer.childNodes[index];
		this.activeCircle.classList.add('active-circle');
		CT.dom[this.activeCircle.nextSibling ? "show" : "hide"](this.nextButton);
		CT.dom[this.activeCircle.previousSibling ? "show" : "hide"](this.prevButton);
	},
	updatePosition: function (direction, force) {
		var index = this.index, absdir = CT.slider.dir2abs[direction];
		if (absdir == "forward" && (force || this.activeCircle.nextSibling))
			index += 1;
		else if (absdir == "backward" && (force || this.activeCircle.previousSibling))
			index -= 1;
		this.updateIndicator(index % this.circlesContainer.childNodes.length);
	},
	trans: function() {
		var opts = {}, axis = CT.slider.orientation2axis[this.opts.orientation];
		opts[axis] = this.container[axis + "Drag"] = -this.index
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
		this.pause();
		this.shift("right");
	},
	nextButtonCallback: function () {
		this.pause();
		this.shift("left");
	}
});

CT.slider.Frame = CT.Class({
	CLASSNAME: "CT.slider.Frame",
	on: { // overwritten by mode functions
		show: function() {},
		hide: function() {}
	},
	peekaboo: function() {
		var opts = this.opts, node = this.node,
			full = CT.dom.node(opts.content, "div", "big carousel-content-full"),
			imageBack = CT.dom.node(null, "div", "carousel-content-image",
				null, null, { backgroundImage: "url(" + opts.img + ")" }),
			nodes = [ imageBack, full ];
		if (this.slider.opts.pan) {
			imageBack.classList.add("bp-left");
			setTimeout(function() { // isn't in dom yet ;)
				CT.trans.pan(imageBack);
			});
		}
		if (opts.title || opts.blurb) {
			var teaser = CT.dom.node([
				CT.dom.node(opts.title, "div", "biggest"),
				CT.dom.node(opts.blurb, "div", "bigger")
			], "div", "carousel-content-teaser transparent hoverglow pointer");
			nodes.push(teaser);
			this.on.show = function() {
				CT.trans.fadeIn(teaser);
			};
			this.on.hide = function() {
				CT.trans.fadeOut(teaser);
			};
		}
		CT.dom.addEach(node, nodes);
		if (opts.content) { // assume title/blurb exists
			var clearAS = this.slider.pause;
			CT.gesture.listen("tap", node.firstChild.nextSibling.nextSibling, function() {
				clearAS();
				node._retracted = !node._retracted;
				if (node._retracted) {
					CT.trans.trans({
						node: imageBack,
						duration: 1000,
						property: "width",
						value: "40%"
					});
					CT.trans.trans({
						node: imageBack,
						duration: 1000,
						property: "height",
						value: "30%",
						cb: function() {
							full.style.zIndex = 100;
						}
					});
					CT.trans.trans({
						node: teaser,
						duration: 1000,
						property: "left",
						value: "0%"
					});
				} else {
					full.style.zIndex = -1;
					["width", "height"].forEach(function(dimension) {
						CT.trans.trans({
							node: imageBack,
							duration: 1000,
							property: dimension,
							value: "100%"
						});
					});
					CT.trans.trans({
						node: teaser,
						duration: 1000,
						property: "left",
						value: "22.5%"
					});
				}
			});
		}
	},
	chunk: function() {
		var slider = new CT.slider.Slider({
			node: this.node,
			frames: this.opts.frames,
			autoSlide: false,
			orientation: CT.slider.other_orientation[this.slider.opts.orientation],
			pauseParent: this.slider.pause,
			arrowPosition: "bottom"
		});
		this.on.show = slider.container.firstChild.frame.on.show;
		this.on.hide = slider.container.firstChild.frame.on.hide;
	},
	init: function(opts, slider) {
		this.opts = opts;
		this.slider = slider;
		this.node = CT.dom.node("", "div",
			"carousel-content-container full" + CT.slider.other_dim[slider.dimension]);
		this.node.frame = this;
		if (slider.dimension == "width")
			this.node.style.display = "inline-block";
		this[slider.opts.mode]();
	}
});