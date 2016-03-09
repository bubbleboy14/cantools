CT.map.Map = CT.Class({
	CLASSNAME: "CT.map.Map",
	markers: {},
	lines: {},
	shapes: {},
	addMarker: function(data) {
		var m = this.markers[data.key] = new CT.map.Marker(data);
		m.add(this.map);
	},
	addLine: function(data) {
		var m = this.lines[data.key] = new CT.map.Line(data);
		m.add(this.map);
	},
	addShape: function(data) {
		var m = this.shapes[data.key] = new CT.map.Shape(data);
		m.add(this.map);
	},
	geoJson: function(gj) { // path or json obj (right?)
		this.map.data.loadGeoJSON(gj);
	},
	latlng: function(position) { // {lat,lng}
		return new google.maps.LatLng(position);
	},
	bounds: function(sw, ne) {
		return new google.maps.LatLngBounds(this.latlng(sw),
			this.latlng(ne));
	},
	frame: function(m1, m2) {
		var p1 = m1.getPosition(),
			p2 = m2.getPosition();
		this.map.fitBounds(this.bounds({
			latitude: Math.min(p1.lat(), p2.lat()),
			longitude: Math.min(p1.lng(), p2.lng())
		}, {
			latitude: Math.max(p1.lat(), p2.lat()),
			longitude: Math.max(p1.lng(), p2.lng())
		}));
	},
	init: function(opts) { // required: node, center{lat,lng}
		this.opts = opts = CT.merge(opts, {
			zoom: 12,
			disableDefaultUI: true,
			zoomControl: true,
			markers: {},
			lines: {},
			shapes: {}
		});
		opts.center = this.latlng(opts.center);
		this.map = new google.maps.Map(opts.node, opts);
		for (var k in opts.markers)
			this.addMarker(opts.markers[k]);
		for (var k in opts.lines)
			this.addLine(opts.lines[k]);
		for (var k in opts.shapes)
			this.addShape(opts.shapes[k]);
		if (opts.geojson)
			this.geoJson(opts.geojson);
	}
});