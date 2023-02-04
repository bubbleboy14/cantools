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
	resizeMarkers: function(w, h) {
		for (var m in this.markers)
			this.markers[m].resize(w, h);
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
		var marker = this.getMarker(key);
		if (marker)
			marker.remove();
		else
			this.log("removeMarker(): can't find key '" + key + "'");
	},
	geoJson: function(gj) { // path or json obj (right?)
		this.map.data.loadGeoJSON(gj);
	},
	fit: function(lat1, lng1, lat2, lng2) {
		this.map.fitBounds(CT.map.util.bounds({
			lat: lat1,
			lng: lng1
		}, {
			lat: lat2,
			lng: lng2
		}));
	},
	frame: function(m1, m2) {
		var p1 = m1.getPosition(),
			p2 = m2.getPosition();
		this.fit(Math.min(p1.lat(), p2.lat()), Math.min(p1.lng(), p2.lng()),
			Math.max(p1.lat(), p2.lat()), Math.max(p1.lng(), p2.lng()));
	},
	autoBounds: function() {
		var mz = Object.values(this.opts.markers),
			las = mz.map(function(m) { return m.position.lat; }),
			los = mz.map(function(m) { return m.position.lng; }),
			minla = Math.min.apply(null, las),
			minlo = Math.min.apply(null, los),
			maxla = Math.max.apply(null, las),
			maxlo = Math.max.apply(null, los),
			midla = (minla + maxla) / 2,
			midlo = (minlo + maxlo) / 2;
		this.log("min", minla, minlo);
		this.log("max", maxla, maxlo);
		this.log("mid", midla, midlo);
		this.opts.center = {
			lat: midla,
			lng: midlo
		};
		return {
			min: { lat: minla, lng: minlo },
			max: { lat: maxla, lng: maxlo }
		};
	},
	_build: function() {
		var k, oz = this.opts,
			bounds = oz.autoFrame && this.autoBounds(),
			bmin = bounds && bounds.min,
			bmax = bounds && bounds.max;
		this.built = true;
		this.opts.center = CT.map.util.latlng(this.opts.center);
		this.map = new google.maps.Map(this.opts.node, this.opts);
		for (k in this.opts.markers)
			this.addMarker(this.opts.markers[k]);
		if (this.opts.geojson)
			this.geoJson(this.opts.geojson);
		// following two lines for firefox, basically -- maybe wrap in if(CT.info.isFirefox)?
		this.refresh();
		this.map.setCenter(this.opts.center);
		bounds && this.fit(bmin.lat, bmin.lng, bmax.lat, bmax.lng);
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
		this.built || this.build();
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
	build: function() {
		if (this.opts.center || this.opts.autoFrame)
			this._build();
		else
			navigator.geolocation.getCurrentPosition(this._geoSucceed, this._geoFail);
	},
	init: function(opts) { // required: node
		this.opts = opts = CT.merge(opts, {
			zoom: 12,
			disableDefaultUI: true,
			zoomControl: true,
			autoFrame: false,
			markers: {},
			listeners: {}
		});
		opts.deferBuild || this.build();
	}
});