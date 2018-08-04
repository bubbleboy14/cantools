CT.map.Panorama = CT.Class({
	CLASSNAME: "CT.map.Panorama",
	rotate: function(diff) {
		this.opts.pov.heading += diff;
		this.pan.setPov(this.opts.pov);
	},
	tilt: function(diff) {
		this.opts.pov.pitch += diff;
		this.pan.setPov(this.opts.pov);
	},
	zoom: function(z) {
		this.opts.zoom = z;
		this.pan.setZoom(z);
	},
	shift: function(lnum) {
		this.pan.setPano(this.pan.getLinks()[lnum || 0].pano);
	},
	_move: function(data, status) {
		if (status == "OK")
			this.pan.setPano(data.location.pano);
		else
			this.log("move failed!", status);
	},
	move: function(coords, as_diffs) {
		if (as_diffs) {
			this.opts.position = {
				lat: this.pan.position.lat(),
				lng: this.pan.position.lng()
			};
			for (var axis in coords)
				this.opts.position[axis] += coords[axis];
		} else
			this.opts.position = coords;
		this.service.getPanorama({
			radius: 50,
			location: this.opts.position
		}, this._move);
	},
	update: function(opts) {
		this.opts = CT.merge(opts, this.opts);
		if (opts.position)
			this.move(opts.position);
		if (opts.pano)
			this.pan.setPano(opts.pano);
		if (opts.pov)
			this.pan.setPov(opts.position);
		if (opts.zoom)
			this.pan.setZoom(opts.zoom);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			cbs: {},
			pov: { // requires: position
				pitch: 0,
				heading: 0
			},
			node: document.body
		});
		this.service = new google.maps.StreetViewService();
		var pan = this.pan = new google.maps.StreetViewPanorama(opts.node, opts);
		setTimeout(function() {
			for (var event_name in opts.cbs)
				pan.addListener(event_name, opts.cbs[event_name]);
		}, 2000);
	}
});