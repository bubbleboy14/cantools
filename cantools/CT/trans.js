CT.trans = {
	_: {
		vender_prefixes: [ "-webkit-", "-moz-", "-ms-", "-o-", ""],
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
			}
		}
	},
	setVenderPrefixed: function(node, property, value) {
	    for (var i = 0; i < CT.trans._.vender_prefixes.length; i++)
	        node.style[CT.trans._.vender_prefixes[i] + property] = value;
	},
	trans: function(opts) {
		// opts: node, property, value, cb, duration, ease prefix
		opts = CT.merge(opts, CT.trans._.defaults.trans);
	    opts.node && CT.trans.setVenderPrefixed(opts.node,
	    	"transition", (CT.trans._.tswap[opts.property] || opts.property)
	        + " " + opts.duration + "ms " + opts.ease);
	    if (opts.cb) {
	        var transTimeout, wrapper = function () {
	            opts.node && CT.trans.setVenderPrefixed(opts.node, "transition", "");
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
	}
};