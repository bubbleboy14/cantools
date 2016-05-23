/*
This module provides convenience functions for messing
around with DOM elements via CSS transitions. Have at it.

### Try out these functions:
	CT.trans.rotate(node, opts)
	CT.trans.translate(node, opts)
	CT.trans.pan(node, opts)
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
		ease: "ease-out",
		prefix: true,
		x: 0,
		y: 0,
		z: 0
	},
	pan: {
		duration: 5000,
		property: "background-position",
		ease: "linear",
		value: "right"
	},
	resize: {
		duration: 1000
	},
	fadeIn: {
		duration: 1000,
		property: "opacity",
		value: 1
	},
	fadeOut: {
		duration: 1000,
		property: "opacity",
		value: 0
	}

TODO: let's add some more, like scale.
*/

CT.trans = {
	_: {
		vender_prefixes: [ "-webkit-", "-moz-", "-ms-", "-o-", "" ],
		tswap: { transform: "-webkit-transform" }, // mobile safari transitions
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
				ease: "ease-out",
				prefix: true,
				x: 0,
				y: 0,
				z: 0
			},
			pan: {
				duration: 5000,
				property: "background-position",
				ease: "linear",
				value: "right bottom"
			},
			resize: {
				duration: 1000
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
		if (opts.node) {
			var prevTrans = opts.node.style.transition || "",
				transComponent = (CT.trans._.tswap[opts.property] || opts.property)
		        	+ " " + opts.duration + "ms " + opts.ease,
		        fullTrans = prevTrans ? (prevTrans + ", " + transComponent) : transComponent;
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
            if (opts.node) CT.trans._.enames.forEach(function(ename) {
	            opts.node.addEventListener(ename, wrapper, false);
        	});
	        transTimeout = setTimeout(wrapper, opts.duration);
	    }
	    if (opts.property && opts.property != "*") {
	        if (opts.prefix)
	            CT.trans.setVenderPrefixed(opts.node, opts.property, opts.value);
	        else
	            opts.node.style[opts.property] = opts.value;
	    }
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
	},
	translate: function(node, opts) {
		opts = CT.merge(opts, CT.trans._.defaults.translate);
		opts.node = node;
		opts.value = "translate3d(" + opts.x + "px," + opts.y + "px," + opts.z + "px)",
		CT.trans.trans(opts);
	},
	pan: function(node, opts) { // for background-position
		opts = CT.merge(opts, CT.trans._.defaults.pan);
		opts.node = node;
		opts.cb = function() {
			opts.value = opts.value == "left top" ? "right bottom" : "left top";
			CT.trans.pan(node, opts);
		}
		CT.trans.trans(opts);
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
	}
};