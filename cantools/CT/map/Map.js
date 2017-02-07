CT.map.Map = CT.Class({
	CLASSNAME: "CT.map.Map",
	markers: {},
	addTriggers: function(data, dtype, datacb, newcb, mlist) {
		var marker = this.addMarker;
		mlist = mlist || CT.dom.id("map" + dtype + "s");
		newcb && mlist.appendChild(CT.panel.trigger({"title": "new " + dtype}, newcb));
		CT.panel.triggerList(data.map(function(orig) {
			d = datacb(orig);
			d.key = orig.key;
			d.marker = marker(d);
			return d;
		}), function(d) {
			d.marker.showInfo();
		}, mlist);
	},
	setMarker: function(data) {
		this.addMarker(data).update(data);
	},
	addMarker: function(data) {
		var m = this.markers[data.key] = this.markers[data.key] || new CT.map.Marker(data);
		if (this.map)
			m.add(this.map);
		else
			this.opts.markers[data.key] = data;
		return m;
	},
	addMarkers: function(dlist) {
		var that = this, ms = [];
		dlist.forEach(function(d) {
			ms.push(that.addMarker(d));
		});
		return ms;
	},
	clearMarkers: function(markers) {
		(Array.isArray(markers) ? markers : Object.values(this.markers)).forEach(function(m) {
			m.remove();
		});
	},
	getMarker: function(key) {
		return this.markers[key];
	},
	removeMarker: function(key) {
		this.getMarker(key).remove();
	},
	geoJson: function(gj) { // path or json obj (right?)
		this.map.data.loadGeoJSON(gj);
	},
	frame: function(m1, m2) {
		var p1 = m1.getPosition(),
			p2 = m2.getPosition();
		this.map.fitBounds(CT.map.util.bounds({
			latitude: Math.min(p1.lat(), p2.lat()),
			longitude: Math.min(p1.lng(), p2.lng())
		}, {
			latitude: Math.max(p1.lat(), p2.lat()),
			longitude: Math.max(p1.lng(), p2.lng())
		}));
	},
	_build: function() {
		var k;
		this.opts.center = CT.map.util.latlng(this.opts.center);
		this.map = new google.maps.Map(this.opts.node, this.opts);
		for (k in this.opts.markers)
			this.addMarker(this.opts.markers[k]);
		if (this.opts.geojson)
			this.geoJson(this.opts.geojson);
		// following two lines for firefox, basically
		this.refresh();
		this.map.setCenter(this.opts.center);
		for (k in this.opts.listeners)
			this.listen(k, this.opts.listeners[k]);
		this.opts.onload && this.opts.onload();
	},
	setCenter: function(latlng) {
		this.map.setCenter(latlng);
	},
	panTo: function(latlng) {
		this.map.panTo(latlng);
	},
	refresh: function() {
		google.maps.event.trigger(this.map, 'resize');
	},
	_geoSucceed: function(pos) {
		this.opts.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
		this._build();
	},
	_geoFail: function() {
		this.opts.center = CT.map.util.getGeoFallback();
		this._build();
	},
	listen: function(evt, cb) {
		google.maps.event.addListener(this.map, evt, cb);
	},
	init: function(opts) { // required: node
		this.opts = opts = CT.merge(opts, {
			zoom: 12,
			disableDefaultUI: true,
			zoomControl: true,
			markers: {},
			listeners: {}
		});
		if (opts.center)
			this._build();
		else
			navigator.geolocation.getCurrentPosition(this._geoSucceed, this._geoFail);
	}
});