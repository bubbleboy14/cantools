CT.map.latlng = function(position) { // {lat,lng}
	return position instanceof google.maps.LatLng
		? position : new google.maps.LatLng(position);
};
CT.map._llcache = {};
CT.map.addr2latlng = function(addr) {
	if (! (addr in CT.map._llcache))
		CT.map._llcache[addr] = CT.net.get("http://maps.googleapis.com/maps/api/geocode/json",
			{ address: addr }, true).results[0].geometry.location;
	return CT.map._llcache[addr];
};

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
	bounds: function(sw, ne) {
		return new google.maps.LatLngBounds(CT.map.latlng(sw),
			CT.map.latlng(ne));
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
	_build: function() {
		var k;
		this.opts.center = CT.map.latlng(this.opts.center);
		this.map = new google.maps.Map(this.opts.node, this.opts);
		for (k in this.opts.markers)
			this.addMarker(this.opts.markers[k]);
		for (k in this.opts.lines)
			this.addLine(this.opts.lines[k]);
		for (k in this.opts.shapes)
			this.addShape(this.opts.shapes[k]);
		if (this.opts.geojson)
			this.geoJson(this.opts.geojson);
	},
	refresh: function() {
		google.maps.event.trigger(this.map, 'resize');
	},
	init: function(opts) { // required: node
		this.opts = opts = CT.merge(opts, {
			zoom: 12,
			disableDefaultUI: true,
			zoomControl: true,
			markers: {},
			lines: {},
			shapes: {}
		});
		if (opts.center)
			this._build();
		else
		    navigator.geolocation.getCurrentPosition(function(pos) {
		        opts.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
		        this._build();
		    }.bind(this));
	}
});