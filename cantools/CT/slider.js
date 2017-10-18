/*
This class is used to generate a slider, which is a segmented,
directionally-constrained draggable DOM element.

The CT.slider.Slider constructor takes an options object, 'opts', which may
define any of several properties. These individual properties, as well as
the 'opts' object itself, are all optional.

### Definable properties are as follows:
    - parent (default: document.body): DOM element in which to build the slider
    - mode (default: 'peekaboo'): how to display each frame - 'peekaboo', 'chunk', 'menu', 'profile', or 'track'
    - subMode (default: 'peekaboo'): which mode to use for chunk-mode frames ('peekaboo', 'menu', 'profile', 'track', 'custom')
    - frameCb (default: null): frame generation callback ('custom' mode)
    - defaultImg (default: undefined): fallback img for any frame mode
    - img (default: undefined): panning background image for whole slider. also works per-chunk.
    - tab (default: undefined): little thing to the side of the frame
    - arrow (default: null): image for pointer arrow (falls back to pointy brackets)
    - autoSlideInterval (default: 5000): how many milliseconds to wait before auto-sliding frames
    - panDuration (default: autoSlideInterval): pan duration for background images
    - translateDuration (default: 300): translation duration for frame advancement transition
    - autoSlide (default: true): automatically proceed through frames (else, trigger later with .resume())
    - visible (default: true): maps to visibility css property
    - navButtons (default: true): include nav bubbles and arrows
    - circular (default: false): allow shifting between 1st and last frames w/ nav buttons (arrows)
    - pan (default: true): slow-pan frame background images
    - translucentTeaser (default: true): translucent box around teaser text (otherwise opaque)
    - startFrame (default: null): label (or index if frames are unlabeled) of frame to slide to initially (disables autoSlide)
    - noStyle (default: false): if true, prevent carousel from overriding color/background rules
    - bubblePosition (default: 'bottom'): where to position frame indicator bubbles ('top' or 'bottom')
    - arrowPosition (default: 'middle'): where to position navigator arrows
    - orientation (default: 'horizontal'): orientation for slider frames to arrange themselves
    - keys (default: true): use arrow keys to navigate slider, as well as enter key for peekaboo transitions
    - noEnter (default: false): disable enter key for peekaboo transitions
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
			noEnter: false,
			translateDuration: 300,
			autoSlideInterval: 5000,
			autoSlide: true,
			visible: true,
			navButtons: true,
			startFrame: null,
			circular: false,
			pan: true,
			noStyle: false,
			translucentTeaser: true,
			arrow: null,
			parent: document.body,
			frameCb: null,
			mode: "peekaboo", // or 'menu' or 'profile' or 'chunk' or 'track' or 'custom'
			subMode: "peekaboo", // or 'menu' or 'profile' or 'track'
			orientation: "horizontal",
			arrowPosition: "middle", // or "top" or "middle"
			bubblePosition: "bottom" // or "top"
		});
		if (typeof opts.parent == "string")
			opts.parent = CT.dom.id(opts.parent);
		if (opts.frameCb) // only makes sense in custom mode
			opts.mode = 'custom';
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
		var pointerNode = function(forward) {
			if (opts.arrow) {
				var img = CT.dom.img(opts.arrow);
				return forward ? img : CT.trans.invert(img);
			}
			return CT.dom.span(forward ? ">" : "<");
		};
		this.prevButton = CT.dom.div(CT.dom.div(pointerNode()),
			bclass + " prv hidden");
		this.nextButton = CT.dom.div(CT.dom.div(pointerNode(true)),
			bclass + " nxt" + (opts.frames.length < 2 ? " hidden" : ""));
		this.index = this.pos = 0;
		this.container = CT.dom.div("",
			"carousel-container full" + CT.slider.other_dim[this.dimension]);
		var content = [
			this.container,
			this.circlesContainer,
			this.prevButton,
			this.nextButton
		];
		if (opts.img) {
			var imgBack = CT.dom.div(CT.dom.img(opts.img, "abs"), "abs all0 noflow");
			if (opts.pan) {
				this.imgBackController = CT.trans.pan(imgBack.firstChild, {
					duration: opts.panDuration || opts.autoSlideInterval
				}, true);
			} else {
				CT.onload(function() {
					CT.dom.cover(imgBack.firstChild);
				}, imgBack.firstChild);
			}
			content.unshift(imgBack);
		}
		this.node = CT.dom.div(content, "carousel fullwidth fullheight"
			+ (opts.visible ? "" : " hider") + (opts.noStyle ? " carousel-nostyle" : ""));
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
		if (opts.orientation == "vertical")
			CT.gesture.listen("wheel", this.container, this.onWheel);
		this.dragOpts = {
			constraint: CT.slider.other_orientation[opts.orientation],
			up: this.updatePosition,
			interval: "auto"
		};
		CT.drag.makeDraggable(this.container, this.dragOpts);
		if (opts.autoSlideInterval && opts.autoSlide && !opts.startFrame)
			this.resume();
		CT.gesture.listen("down", this.container, this.pause);
		CT.onresize(this.trans);//, this.opts.parent);
		this._reflow();
		if (opts.startFrame in this.jumpers)
			setTimeout(this.jumpers[opts.startFrame]); // wait one tick for inits
	},
	on: {
		hide: function() {
			this.imgBackController && this.imgBackController.pause();
			this.container.childNodes[this.index].frame.on.hide();
		},
		show: function() {
			this.imgBackController && this.imgBackController.resume();
			this.container.childNodes[this.index].frame.on.show();
		}
	},
	onWheel: function(pos, delta) {
		if (delta > 0)
			this.nextButtonCallback();
		else
			this.prevButtonCallback();
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
		this.on.show();
	},
	hide: function() {
		this.node.classList.add("hider");
		this.on.hide();
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
			this._autoSlide = setInterval(this.autoSlideCallback, this.opts.autoSlideInterval);
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
		var index = this.index, absdir = CT.drag._.dir2abs[direction],
			cccnl = this.circlesContainer.childNodes.length;
		if (CT.drag._.direction2orientation[direction] == this.opts.orientation) {
			if (absdir == "forward" && (force || this.activeCircle.nextSibling))
				index += 1;
			else if (absdir == "backward" && (force || this.activeCircle.previousSibling))
				index -= 1;
			if (cccnl)
				this.updateIndicator((index + cccnl) % cccnl);
		} else if (this.opts.parent.slider)
			this.opts.parent.slider.shift(direction, force);
	},
	trans: function() {
		var opts = {}, axis = CT.drag._.orientation2axis[this.opts.orientation];
		opts[axis] = this.container[axis + "Drag"] = -this.index
			* CT.align[this.dimension](this.container) / this.container.childNodes.length;
		opts.duration = this.opts.translateDuration;
		CT.trans.translate(this.container, opts);
	},
	shift: function(direction, force) {
		this.updatePosition(direction, force || this.opts.circular);
		this.trans();
	},
	autoSlideCallback: function() {
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
		var opts = this.opts, node = this.node, slider = this.slider, pulser,
			full = CT.dom.node(opts.content, "div", "big carousel-content-full"),
			imageBack = CT.dom.node(CT.dom.img(opts.img || slider.opts.defaultImg, "abs"), "div", "w1 h1 noflow carousel-content-image"),
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
				this.tab && this.tab.hide();
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
				this.tab && this.tab.show(slider.opts.parent);
			}
		};
		if (slider.opts.pan) {
			imageBack.controller = CT.trans.pan(imageBack.firstChild, {
				duration: opts.panDuration || slider.opts.panDuration || slider.opts.autoSlideInterval
			});
		} else {
			CT.onload(function() {
				CT.dom.cover(imageBack.firstChild);
			}, imageBack.firstChild);
		}
		if (opts.title || opts.blurb) {
			var blurbNode = CT.dom.div(opts.blurb, "bigger"), teaser = CT.dom.div([
				CT.dom.div(opts.title, "biggest"), blurbNode
			], "carousel-content-teaser transparent hoverglow pointer cc-teaser-"
				+ (slider.opts.translucentTeaser ? "trans" : "opaque"));
			CT.dom.fit(blurbNode);
			nodes.push(teaser);
		}
		if (opts.pulse) {
			pulser = CT.dom.img(opts.pulse, "carousel-pulse pointer");
			pulser.controller = CT.trans.pulse(pulser);
			CT.gesture.listen("tap", pulser, teaserTap); // assume content exists
			nodes.push(pulser);
		}
		this.on.show = function() {
			if (opts.title || opts.blurb) {
				CT.trans.fadeIn(teaser);
				blurbNode.style.maxHeight = (teaser.parentNode.clientHeight - 200) + "px";
				blurbNode.fit();
			}
			if (slider.opts.keys && !slider.opts.noEnter && teaser) // unreg somewhere?
				CT.key.on("ENTER", teaserTap);
			if (slider.opts.pan)
				imageBack.controller.resume();
			if (opts.pulse)
				pulser.controller.resume();
			if (this.tab)
				this.tab.show(slider.opts.parent);
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
			if (this.tab)
				this.tab.hide();
		};
		CT.dom.addEach(node, nodes);
		if (opts.content) // assume title/blurb exists
			CT.gesture.listen("tap", teaser, teaserTap);
		else if (opts.onclick)
			CT.gesture.listen("tap", teaser, opts.onclick);
	},
	chunk: function() {
		var slider = new CT.slider.Slider({
			parent: this.node,
			frames: this.opts.frames,
			mode: this.opts.mode || this.slider.opts.subMode,
			autoSlide: false,
			img: this.opts.img,
			pan: this.slider.opts.pan,
			arrow: this.slider.opts.arrow,
			defaultImg: this.slider.opts.defaultImg,
			translucentTeaser: this.slider.opts.translucentTeaser,
			orientation: CT.slider.other_orientation[this.slider.opts.orientation],
			arrowPosition: "bottom"
		}), parent = this.slider;
		this.on.hide = slider.on.hide;
		this.on.show = function() {
			slider.on.show();
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
				arr.push(CT.dom.img(logo || this.slider.opts.defaultImg));
			return arr;
		};
		this.node.appendChild(CT.dom.marquee(logos(this.opts.logo), "abs top0 h20p fullwidth"));
		this.node.appendChild(CT.dom.marquee(logos(this.opts.logo), "abs bottom0 h20p fullwidth", "right"));
		this.on.hide = menu.hide;
		this.on.show = menu.show;
	},
	profile: function() {
		var opts = CT.merge(this.opts, this.slider.opts, {
			panDuration: this.slider.opts.autoSlideInterval,
			controllerHook: this.on
		});
		opts.img = opts.img || this.slider.opts.defaultImg;
		CT.dom.addContent(this.node, CT.layout.profile(opts));
	},
	track: function() { // add img!
		var audio = CT.dom.audio(this.opts.src, true, false, false,
			null, this.slider.autoSlideCallback), pause = function() {
				audio.playing = false;
				audio.pause();
			}, resume = function() {
				audio.playing = true;
				audio.play();
			}, pauseResume = function() {
				audio.playing ? pause() : resume();
			};
		this.on.hide = pause;
		this.on.show = function() {
			resume();
			CT.key.on("SPACE", pauseResume);
		};
		CT.dom.addContent(this.node, CT.dom.div([
			CT.dom.div(this.opts.song, "gigantic"),
			CT.dom.div(this.opts.album, "biggerest"),
			audio
		], "full-center outlined"));
	},
	custom: function() {
		CT.dom.addContent(this.node, this.slider.opts.frameCb(this.opts));
	},
	init: function(opts, slider) {
		var mode = opts.mode || slider.opts.mode;
		this.opts = opts;
		this.node = CT.dom.div("", "carousel-content-container full"
			+ CT.slider.other_dim[slider.dimension] + ((mode == "custom") ? " scroller" : ""));
		this.node.frame = this;
		this.slider = this.node.slider = slider;
		if (slider.dimension == "width")
			this.node.style.display = "inline-block";
		var topts = opts.tab || slider.opts.tab;
		if (topts) {
			var tab = this.tab = new CT.modal.Modal({
				content: topts.content,
				center: false,
				noClose: true,
				className: "basicpopup abs rounder translucent above shiftall",
				transition: "slide",
				slide: {
					origin: topts.origin
				}
			});
			this.on.show = function() {
				if (tab.isClear())
					tab.set(topts.content);
				tab.show(slider.opts.parent);
			};
			this.on.hide = tab.hide;
		}
		this[mode]();
	}
});