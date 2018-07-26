CT.map.Panorama = CT.Class({
	CLASSNAME: "CT.map.Panorama",
	rotate: function(diff) {
		this.opts.pov.heading += diff;
		this.pan.setPov(this.opts.pov);
	},
	pitch: function(diff) {
		this.opts.pov.pitch += diff;
		this.pan.setPov(this.opts.pov);
	},
	move: function(diffs) {
		for (var axis in diffs)
			this.opts.position[axis] += diffs[axis];
		this.pan.setPosition(this.opts.position);
	},
	update: function(opts) {
		this.opts = CT.merge(opts, this.opts);
		if (opts.position)
			this.pan.setPosition(opts.position);
		if (opts.pov)
			this.pan.setPov(opts.position);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			pov: { // requires: position
				pitch: 0,
				heading: 0
			},
			node: document.body
		});
		this.pan = new google.maps.StreetViewPanorama(opts.node, {
			pov: opts.pov,
			position: opts.position
		});
	}
});