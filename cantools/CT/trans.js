/*
This module provides convenience functions for messing
around with DOM elements via CSS transitions. Have at it.

### Try out these functions:
	CT.trans.rotate(node, opts)
	CT.trans.translate(node, opts)
	CT.trans.wobble(node, opts)
	CT.trans.pan(node, opts, wait)
	CT.trans.resize(node, opts)
	CT.trans.fadeIn(node, opts)
	CT.trans.fadeOut(node, opts)
	CT.trans.pulse(node, opts)
	CT.trans.trans(opts)
	CT.trans.setVendorPrefixed(node, property, value)
	 - sets CSS properties for all vendor prefixes
	   - [ "-webkit-", "-moz-", "-ms-", "-o-", "" ]

### And here are the default options:
	trans: {
		duration: 500,
		property: "*",
		ease: "ease-in-out"
	},
	rotate: {
		degrees: 180,
		duration: 1000,
		property: "transform",
		ease: "linear",
		prefix: true
	},
	translate: {
		duration: 300,
		property: "transform",
		ease: "linear",
		prefix: true,
		x: 0,
		y: 0,
		z: 0
	},
	wobble: {
		axis: "x",
		radius: 50,
		duration: 100
	},
	pan: {
		duration: 5000,
		ease: "linear",
		x: 0,
		y: 0
	},
	resize: {
		duration: 300,
		ease: "linear"
	},
	fadeIn: {
		duration: 1600,
		property: "opacity",
		value: 1
	},
	fadeOut: {
		duration: 1600,
		property: "opacity",
		value: 0
	},
	pulse: {
		wait: 1000
	},
	invert: {
		direction: "horizontal", // or vertical
		property: "transform",
		prefix: true
	}

TODO: let's add some more, like scale.

Certain functions (pan() and pulse()) return a CT.trans.Controller instance.

### CT.trans.Controller
	pause()  - stop the transition (for now)
	resume() - resume the transition
	active() - returns status of transition (bool)
	tick()   - calls cb() if active()
	init(cb) - cb() is called by tick() if active()
*/

CT.trans = {
	_: {
		vender_prefixes: [ "-webkit-", "-moz-", "-ms-", "-o-", "" ],
		enames: [ "webkitTransitionEnd", "mozTransitionEnd", "oTransitionEnd", "transitionend"],
		defaults: {
			trans: {
				duration: 500,
				property: "*",
				ease: "ease-in-out"
			},
			rotate: {
				degrees: 180,
				duration: 1000,
				property: "transform",
				ease: "linear",
				prefix: true
			},
			translate: {
				duration: 300,
				property: "transform",
				ease: "linear",
				prefix: true,
				x: 0,
				y: 0,
				z: 0
			},
			wobble: {
				axis: "x",
				radius: 50,
				duration: 100
			},
			pan: {
				duration: 5000,
				ease: "linear",
				x: 0,
				y: 0
			},
			resize: {
				duration: 300,
				ease: "linear"
			},
			fadeIn: {
				duration: 1600,
				property: "opacity",
				value: 1
			},
			fadeOut: {
				duration: 1600,
				property: "opacity",
				value: 0
			},
			pulse: {
				wait: 1000
			},
			invert: {
				direction: "horizontal", // or vertical
				property: "transform",
				prefix: true
			}
		}
	},
	setVenderPrefixed: function(node, property, value) {
	    for (var i = 0; i < CT.trans._.vender_prefixes.length; i++)
	        node.style[CT.trans._.vender_prefixes[i] + property] = value;
	},
	trans: function(opts) {
		// opts: node, property, value, cb, duration, ease, prefix
		opts = CT.merge(opts, CT.trans._.defaults.trans);
		if (typeof opts.node == "string")
			opts.node = CT.dom.id(opts.node);
		if (opts.node) {
			var prevTrans = opts.node.style.transition || "",
				transComponent = opts.property + " " + opts.duration + "ms " + opts.ease,
		        fullTrans = (prevTrans && prevTrans.indexOf(transComponent) == -1)
		        	? (prevTrans + ", " + transComponent) : transComponent;
		    CT.trans.setVenderPrefixed(opts.node, "transition", fullTrans);
		}
	    if (opts.cb) {
	        var transTimeout, wrapper = function () {
	            opts.node && CT.trans.setVenderPrefixed(opts.node, "transition", prevTrans);
	            clearTimeout(transTimeout);
	            transTimeout = null;
	            if (opts.node) CT.trans._.enames.forEach(function(ename) {
		            opts.node.removeEventListener(ename, wrapper, false);
            	});
	            opts.cb();
	        }
            if (opts.node) {
            	CT.trans._.enames.forEach(function(ename) {
		            opts.node.addEventListener(ename, wrapper, false);
	        	});
	        	opts.node.finish = wrapper;
            } else // only use timeout as fallback
		        transTimeout = setTimeout(wrapper, opts.duration);
	    }
	    if (opts.node && opts.property && opts.property != "*") {
	        if (opts.prefix)
	            CT.trans.setVenderPrefixed(opts.node, opts.property, opts.value);
	        else
	            opts.node.style[opts.property] = opts.value;
	    }
	},
	invert: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.invert);
		opts.node = node;
		opts.value = "scale" + (opts.direction == "horizontal"
			? "X" : "Y") + "(-1)";
		CT.trans.trans(opts);
		return node;
	},
	rotate: function(node, opts) {
		// opts may include: duration, degrees, cb, ease, forever
		opts = CT.merge(opts, CT.trans._.defaults.rotate);
		opts.node = node;
		opts.value = "rotate(" + opts.degrees + "deg)";
		if (opts.forever) opts.cb = function() {
			opts.degrees += CT.trans._.defaults.rotate.degrees;
			CT.trans.rotate(node, opts);
		};
		CT.trans.trans(opts);
		return node;
	},
	translate: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.translate);
		opts.node = node;
		if (opts.axis)
			opts[opts.axis] = opts.value;
		opts.value = "translate3d(" + opts.x + "px," + opts.y + "px," + opts.z + "px)",
		CT.trans.trans(opts);
	},
	wobble: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.wobble);
		CT.trans.translate(node, {
			axis: opts.axis,
			ease: "ease-out",
			value: opts.radius,
			duration: opts.duration,
			cb: function() {
				CT.trans.translate(node, {
					axis: opts.axis,
					ease: "ease-in-out",
					value: -opts.radius,
					duration: opts.duration * 2,
					cb: function() {
						CT.trans.translate(node, {
							axis: opts.axis,
							ease: "ease-in",
							value: 0,
							duration: opts.duration
						});
					}
				});
			}
		});
	},
	pan: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.pan);
		var setV = function(cb) {
			node._vertical = CT.dom.cover(node);
			node._prop = node._vertical ? "y" : "x",
			node._dim = node._vertical ? "clientHeight" : "clientWidth";
			node._bound = node.parentNode[node._dim] - node[node._dim];
			if (opts[node._prop] < node._bound) {
				opts[node._prop] = 0;
				node.finish && node.finish();
			}
			cb && setTimeout(cb);
		}, controllercb = function() {
			opts[node._prop] = opts[node._prop] ? 0 : node._bound;
			CT.trans.translate(node, opts);
		}, controller = new CT.trans.Controller(controllercb, "pan");
		node.onload = function() {
			var oldprop = node._prop;
			setV();
			if (oldprop && oldprop != node._prop)
				opts[oldprop] = 0;
			setTimeout(controller.resume); // wait a tic!
		};
		CT.onresize(node.onload); // ??? <-- looks wrong
		opts.cb = controller.tick;
		return controller;
	},
	resize: function(node, opts) {
		var width = opts.width,
			height = opts.height,
			cb = opts.cb;
		delete opts.width;
		delete opts.height;
		delete opts.cb;
		opts.node = node;
		opts = CT.merge(opts, CT.trans._.defaults.resize);
		if (width) {
			CT.trans.trans(CT.merge({
				property: "width",
				value: width
			}, opts));
		}
		if (height) {
			CT.trans.trans(CT.merge({
				property: "height",
				value: height
			}, opts));
		}
		if (cb) {
			CT.trans.trans(CT.merge({
				cb: cb
			}, opts));
		}
	},
	fadeIn: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.fadeIn);
		opts.node = node;
		CT.trans.trans(opts);
	},
	fadeOut: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.fadeOut);
		opts.node = node;
		CT.trans.trans(opts);
	},
	pulse: function(node, opts, wait) {
		opts = CT.merge(opts, CT.trans._.defaults.pulse);
		var faded, controller = new CT.trans.Controller(function() {
			faded = !faded;
			if (faded) {
				setTimeout(function() {
					CT.trans.fadeIn(node, opts);
				}, opts.wait);
			} else
				CT.trans.fadeOut(node, opts);
		}, "pulse");
		opts.cb = controller.tick;
		if (!wait)
			controller.tick();
		return controller;
	},
	glow: function(node) {
		node.classList.add("glowing");
		node.classList.add("glogo");
		setTimeout(function() {
			node.classList.remove("glogo");
		}, 1000);
		setTimeout(function() {
			node.classList.remove("glowing");
		}, 2000);
	}
};

CT.trans.Controller = CT.Class({
	CLASSNAME: "CT.trans.Controller",
	pause: function() {
		this._paused = true;
	},
	resume: function() {
		this.verbose && this.log("resume", this.name);
		if (this._paused != false) {
			this._paused = false;
			if (this._stalled) {
				this._stalled = false;
				this.cb();
			}
		}
	},
	active: function() {
		return !this._paused;
	},
	tick: function() {
		if (this.active())
			this.cb();
		else
			this._stalled = true;
	},
	init: function(cb, name, verbose) {
		this.cb = cb;
		this.name = name;
		this.verbose = verbose;
		this._stalled = true;
	}
});