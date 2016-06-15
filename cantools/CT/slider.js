/*
This class is used to generate a slider, which is a segmented,
directionally-constrained draggable DOM element.

The CT.slider.Slider constructor takes an options object, 'opts', which may
define any of several properties. These individual properties, as well as
the 'opts' object itself, are all optional.

### Definable properties are as follows:
    - parent (default: document.body): DOM element in which to build the slider
    - mode (dfault: 'peekaboo'): how to display each frame - 'peekaboo', 'chunk', 'menu', or 'profile'
    - autoSlideInterval (default: 5000): how many milliseconds to wait before auto-sliding frames
    - autoSlide (default: true): automatically proceed through frames (else, trigger later with .resume())
    - visible (default: true): maps to visibility css property
    - navButtons (default: true): include nav bubbles and arrows
    - pan (default: true): slow-pan frame background images
    - startFrame (default: null): label (or index if frames are unlabeled) of frame to slide to initially (disables autoSlide)
    - bubblePosition (default: 'bottom'): where to position frame indicator bubbles ('top' or 'bottom')
    - arrowPosition (default: 'middle'): where to position navigator arrows
    - orientation (default: 'horizontal'): orientation for slider frames to arrange themselves
    - keys (default: true): use arrow keys to navigate slider, as well as enter key for peekaboo transitions
    - frames (default: []): an array of items corresponding to the frames in the slider

The last one, 'frames', must be an array either of strings (interpreted
as image urls) or of data objects (processed in the addFrame function).
*/

CT.slider = {
	other_dim: { height: "width", width: "height" },
	other_orientation: { vertical: "horizontal", horizontal: "vertical" },
	orientation2dim: { vertical: "height", horizontal: "width" },
	orientation2abs: {
		vertical: {
			forward: "up",
			backward: "down"
		},
		horizontal: {
			forward: "left",
			backward: "right"
		}
	}
};

CT.slider.Slider = CT.Class({
	CLASSNAME: "CT.slider.Slider",
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			frames: [],
			keys: true,
			autoSlideInterval: 5000,
			autoSlide: true,
			visible: true,
			navButtons: true,
			startFrame: null,
			pan: true,
			parent: document.body,
			mode: "peekaboo", // or 'chunk'
			orientation: "horizontal",
			arrowPosition: "middle", // or "top" or "middle"
			bubblePosition: "bottom" // or "top"
		});
		this.jumpers = {};
		this.dimension = CT.slider.orientation2dim[opts.orientation];
		this.circlesContainer = CT.dom.node("", "div",
			"carousel-order-indicator " + opts.bubblePosition);

		var bclass = "slider-btn hoverglow pointer sb-"
			+ this.opts.arrowPosition + " sb-" + opts.orientation;
		if (!opts.navButtons) {
			bclass += " hider";
			this.circlesContainer.classList.add("hider");
		}
		this.prevButton = CT.dom.node(CT.dom.node(CT.dom.node("<", "span")), "div",
			bclass + " prv hidden");
		this.nextButton = CT.dom.node(CT.dom.node(CT.dom.node(">", "span")), "div",
			bclass + " nxt" + (opts.frames.length < 2 ? " hidden" : ""));
		this.index = this.pos = 0;
		this.container = CT.dom.node("", "div",
			"carousel-container full" + CT.slider.other_dim[this.dimension]);
		this.node = CT.dom.node([
			this.container,
			this.circlesContainer,
			this.prevButton,
			this.nextButton
		], "div", "carousel fullwidth fullheight" + (opts.visible ? "" : " hider"));
		this.opts.parent.appendChild(this.node);
		this.opts.frames.forEach(this.addFrame);
		CT.gesture.listen("tap", this.prevButton, this.prevButtonCallback);
		CT.gesture.listen("tap", this.nextButton, this.nextButtonCallback);
		if (opts.keys) {
			CT.key.on(opts.orientation == "horizontal" ?
				"LEFT" : "UP", this.prevButtonCallback);
			CT.key.on(opts.orientation == "horizontal" ?
				"RIGHT" : "DOWN", this.nextButtonCallback);
		}
		this.dragOpts = {
			constraint: CT.slider.other_orientation[opts.orientation],
			up: this.updatePosition,
			interval: "auto"
		};
		CT.drag.makeDraggable(this.container, this.dragOpts);
		if (opts.autoSlideInterval && opts.autoSlide && !opts.startFrame)
			this.resume();
		CT.gesture.listen("down", this.container, this.pause);
		this.opts.parent.onresize = this.trans;
		this._reflow();
		if (opts.startFrame in this.jumpers)
			this.jumpers[opts.startFrame]();
	},
	showNav: function() {
		if (this.opts.navButtons) {
			CT.trans.translate(this.prevButton, {
				x: 0
			});
			CT.trans.translate(this.nextButton, {
				x: 0
			});
			CT.trans.translate(this.circlesContainer, {
				y: 0
			});
		}
		if (this.opts.parent.slider)
			this.opts.parent.slider.showNav();
	},
	hideNav: function() {
		if (this.opts.navButtons) {
			CT.trans.translate(this.prevButton, {
				x: -200
			});
			CT.trans.translate(this.nextButton, {
				x: 200
			});
			CT.trans.translate(this.circlesContainer, {
				y: (this.opts.bubblePosition == "top") && -100 || 100
			});
		}
		if (this.opts.parent.slider)
			this.opts.parent.slider.hideNav();
	},
	show: function() {
		this.node.classList.remove("hider");
	},
	hide: function() {
		this.node.classList.add("hider");
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
	pause: function() {
		if (this._autoSlide) {
			clearInterval(this._autoSlide);
			this._autoSlide = null;
		}
		this.opts.parent.slider && this.opts.parent.slider.pause();
	},
	addFrame: function(frame, index) {
		if (typeof frame == "string")
			frame = { img: frame };
		var circle = CT.dom.node(frame.label, "div",
			"hoverglow pointer indicator-circle " +
			(frame.label ? "labeled" : "unlabeled") + "-circle"),
			jumper = this.jumpers[frame.label || index] = this.circleJump(index);
		CT.gesture.listen("tap", circle, jumper);
		this.circlesContainer.appendChild(circle);
		this.container.appendChild((new CT.slider.Frame(frame, this)).node);
		if (index == 0) {
			circle.className += " active-circle";
			this.activeCircle = circle;
			if (!this.opts.parent.slider) // exclude embedded slider
				setTimeout(this.container.firstChild.frame.on.show, 500);
		}
		if (index == undefined) // ad-hoc frame
			this._reflow();
	},
	circleJump: function(index) {
		var f = function() {
			this.pause();
			this.updateIndicator(index);
			this.trans();
		}.bind(this);
		return f;
	},
	updateIndicator: function(index) {
		this.container.childNodes[this.index].frame.on.hide();
		this.index = index;
		this.container.childNodes[this.index].frame.on.show();
		this.activeCircle.classList.remove('active-circle');
		this.activeCircle = this.circlesContainer.childNodes[index];
		this.activeCircle.classList.add('active-circle');
		CT.dom[this.activeCircle.nextSibling ? "show" : "hide"](this.nextButton);
		CT.dom[this.activeCircle.previousSibling ? "show" : "hide"](this.prevButton);
	},
	updatePosition: function(direction, force) {
		var index = this.index, absdir = CT.drag._.dir2abs[direction];
		if (CT.drag._.direction2orientation[direction] == this.opts.orientation) {
			if (absdir == "forward" && (force || this.activeCircle.nextSibling))
				index += 1;
			else if (absdir == "backward" && (force || this.activeCircle.previousSibling))
				index -= 1;
			this.updateIndicator(index % this.circlesContainer.childNodes.length);
		} else if (this.opts.parent.slider)
			this.opts.parent.slider.shift(direction, force);
	},
	trans: function() {
		var opts = {}, axis = CT.drag._.orientation2axis[this.opts.orientation];
		opts[axis] = this.container[axis + "Drag"] = -this.index
			* CT.align[this.dimension](this.container) / this.container.childNodes.length;
		CT.trans.translate(this.container, opts);
	},
	shift: function(direction, force) {
		this.updatePosition(direction, force);
		this.trans();
	},
	_autoSlideCallback: function() {
		this.shift(CT.slider.orientation2abs[this.opts.orientation].forward, true);
	},
	prevButtonCallback: function() {
		this.pause();
		this.shift(CT.slider.orientation2abs[this.opts.orientation].backward);
	},
	nextButtonCallback: function() {
		this.pause();
		this.shift(CT.slider.orientation2abs[this.opts.orientation].forward);
	}
});

CT.slider.Frame = CT.Class({
	CLASSNAME: "CT.slider.Frame",
	on: { // overwritten by mode functions
		show: function() {},
		hide: function() {}
	},
	peekaboo: function() {
		var opts = this.opts, node = this.node, slider = this.slider, pulser, tab,
			full = CT.dom.node(opts.content, "div", "big carousel-content-full"),
			imageBack = CT.dom.node(null, "div", "carousel-content-image",
				null, null, { backgroundImage: "url(" + opts.img + ")" }),
			nodes = [ imageBack, full ];
		var teaserTap = function() {
			slider.pause();
			node._retracted = !node._retracted;
			if (node._retracted) {
				CT.trans.resize(imageBack, {
					width: "40%",
					height: "30%",
					cb: function() {
						if (pulser) pulser.style.zIndex = 200;
					}
				});
				CT.trans.trans({
					node: teaser,
					property: "left",
					value: "10px"
				});
				CT.trans.trans({
					node: teaser,
					property: "top",
					value: "0px"
				});
				slider.hideNav();
			} else {
				if (pulser) pulser.style.zIndex = 0;
				CT.trans.resize(imageBack, {
					width: "100%",
					height: "100%"
				});
				CT.trans.trans({
					node: teaser,
					property: "left",
					value: "22.5%"
				});
				CT.trans.trans({
					node: teaser,
					property: "top",
					value: "100px"
				});
				slider.showNav();
			}
		};
		if (slider.opts.pan) {
			imageBack.classList.add("bp-left");
			imageBack.controller = CT.trans.pan(imageBack, {
				duration: opts.panDuration || slider.opts.autoSlideInterval
			}, true);
		}
		if (opts.tab) {
			tab = new CT.modal.Modal({
				content: opts.tab.content,
				center: false,
				noClose: true,
				className: "basicpopup rounder translucent above shiftall",
				transition: "slide",
				slide: {
					origin: opts.tab.origin
				}
			});
		}
		if (opts.title || opts.blurb) {
			var teaser = CT.dom.node([
				CT.dom.node(opts.title, "div", "biggest"),
				CT.dom.node(opts.blurb, "div", "bigger")
			], "div", "carousel-content-teaser transparent hoverglow pointer");
			nodes.push(teaser);
		}
		if (opts.pulse) {
			pulser = CT.dom.img(opts.pulse, "carousel-pulse pointer");
			pulser.controller = CT.trans.pulse(pulser, null, true);
			CT.gesture.listen("tap", pulser, teaserTap); // assume content exists
			nodes.push(pulser);
		}
		this.on.show = function() {
			if (opts.title || opts.blurb)
				CT.trans.fadeIn(teaser);
			if (slider.opts.keys)
				CT.key.on("ENTER", teaserTap);
			if (slider.opts.pan)
				imageBack.controller.resume();
			if (opts.pulse)
				pulser.controller.resume();
			if (opts.tab)
				tab.show();
		};
		this.on.hide = function() {
			if (opts.title || opts.blurb)
				CT.trans.fadeOut(teaser);
			if (node._retracted)
				teaserTap();
			if (slider.opts.pan)
				imageBack.controller.pause();
			if (opts.pulse)
				pulser.controller.pause();
			if (opts.tab)
				tab.hide();
		};
		CT.dom.addEach(node, nodes);
		if (opts.content) // assume title/blurb exists
			CT.gesture.listen("tap", teaser, teaserTap);
	},
	chunk: function() {
		var slider = new CT.slider.Slider({
			parent: this.node,
			frames: this.opts.frames,
			autoSlide: false,
			orientation: CT.slider.other_orientation[this.slider.opts.orientation],
			arrowPosition: "bottom"
		}), parent = this.slider;
		this.on.hide = function() {
			slider.container.childNodes[slider.index].frame.on.hide();
		};
		this.on.show = function() {
			slider.container.childNodes[slider.index].frame.on.show();
			if (parent.opts.keys) {
				CT.key.on(slider.opts.orientation == "horizontal" ?
					"LEFT" : "UP", slider.prevButtonCallback);
				CT.key.on(slider.opts.orientation == "horizontal" ?
					"RIGHT" : "DOWN", slider.nextButtonCallback);
			}
		};
	},
	menu: function() {
		var menu = new CT.modal.Modal({
			transition: "slide",
			noClose: true,
			className: "round centered basicpopup above",
			content: this.opts.buttons.map(function(d) {
				var n = CT.dom.node([
					CT.dom.node(d.label || d.page, "div", "biggest bold bottombordered"),
					CT.dom.node(d.content)
				], "div", "margined padded bordered round hoverglow pointer inline-block");
				n.onclick = function() {
					location = d.url || ("/" + d.page + ".html");
				};
				return n;
			})
		});
		var logos = function(logo) {
			var arr = [];
			for (var i = 0; i < 5; i++)
				arr.push(CT.dom.img(logo));
			return arr;
		};
		this.node.appendChild(CT.dom.marquee(logos(this.opts.logo), "abs top0 h20p fullwidth"));
		this.node.appendChild(CT.dom.marquee(logos(this.opts.logo), "abs bottom0 h20p fullwidth", "right"));
		this.on.hide = menu.hide;
		this.on.show = menu.show;
	},
	profile: function() {
		var img = CT.dom.node(null, "div", "w2-3 h4-5",
			null, null, { backgroundImage: "url(" + this.opts.img + ")" }),
			buttons = CT.dom.node(null, "div", "centered");
		if (this.slider.opts.pan) {
			img.classList.add("bp-right");
			img.controller = CT.trans.pan(img, {
				duration: this.opts.panDuration || this.slider.opts.autoSlideInterval
			}, true);
			this.on.hide = img.controller.pause;
			this.on.show = img.controller.resume;
		}
		for (var b in this.opts.buttons)
			buttons.appendChild(CT.dom.button(b, this.opts.buttons[b], "round padded margined"));
		this.node.appendChild(CT.dom.node([
			CT.dom.node(this.opts.name, "div", "biggest"),
			CT.dom.node(this.opts.description)
		], "div", "right thirdwidth"));
		this.node.appendChild(img);
		this.node.appendChild(buttons);
	},
	init: function(opts, slider) {
		this.opts = opts;
		this.node = CT.dom.node("", "div",
			"carousel-content-container full" + CT.slider.other_dim[slider.dimension]);
		this.node.frame = this;
		this.slider = this.node.slider = slider;
		if (slider.dimension == "width")
			this.node.style.display = "inline-block";
		this[opts.mode || slider.opts.mode]();
	}
});