CT.map.Line = CT.Class({
	add: function(map) {
		this.opts.map = map;
		this.line.setMap(map);
	},
	remove: function() {
		this.opts.map = null;
		this.line.setMap(null);
	},
	init: function(opts) {
		this.opts = opts;
		this.line = new google.maps.Polyline(opts);
		if (opts.map)
			this.add(opts.map);
	}
});