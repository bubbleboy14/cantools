CT.map.util = {
	_: {
		keys: [],
		kindex: 0,
		try_limit: 20,
		llcache: CT.storage.get("addr2latlng") || {},
		geo_fallback: { lat: 37.75, lng: -122.45 },
		get_res: function(addr) {
			var params = { address: addr }, _ = CT.map.util._,
				k = _.keys[_.kindex];
			if (k) {
				params.key = k;
				_.kindex += 1;
			} else
				_.kindex = 0;
			return CT.net.get("https://maps.googleapis.com/maps/api/geocode/json", params, true).results[0];
		},
		try_a2ll: function(addr) {
			var tries = 0, res, key, _ = CT.map.util._;
			while( tries < _.try_limit && !res ) {
				res = _.get_res(addr);
				if (res) return res
				tries += 1;
				CT.log("CT.map.util.addr2latlng: can't find " + addr + " - trying again! tries: " + tries);
			}
		}
	},
	setGeoKeys: function(keys) {
		CT.map.util._.keys = keys;
	},
	setGeoFallback: function(pos) {
		CT.map.util._.geo_fallback = pos;
	},
	getGeoFallback: function() {
		return CT.map.util._.geo_fallback;
	},
	icon: function(icon, marker) { // preserve image opts, if any
		if (icon && typeof icon == "string") {
			var orig = marker.getIcon();
			if (orig && orig.url) // is obj -- retain all but url
				return CT.merge({ url: icon }, orig);
		}
		return icon;
	},
	latlng: function(position) { // {lat,lng}
		return position instanceof google.maps.LatLng
			? position : new google.maps.LatLng(position);
	},
	addr2latlng: function(addr) {
		var _ = CT.map.util._, c = _.llcache;
		if (!c[addr]) {
			c[addr] = _.try_a2ll(addr).geometry.location;
			CT.storage.set("addr2latlng", c);
		}
		return c[addr];
	},
	ips2latlngs: function(ips, cb) {
		CT.net.post({
			path: location.protocol + "//api.mkult.co/geo",
			params: { action: "ips", ips: ips },
			cb: cb
		});
	},
	bounds: function(sw, ne) {
		return new google.maps.LatLngBounds(CT.map.util.latlng(sw),
			CT.map.util.latlng(ne));
	},
	distance: function(origin, destination, cb, mode, units) {
		var _ = CT.map.util._;
		if (!_.dservice)
			_.dservice = new google.maps.DistanceMatrixService();
		_.dservice.getDistanceMatrix({
			origins: [origin],
			destinations: [destination],
			travelMode: google.maps.TravelMode[mode || "DRIVING"],
			unitSystem: google.maps.UnitSystem[units || "IMPERIAL"]
		}, function(resp, status) {
			if (status != "OK")
				return alert("distance error: " + status);
			cb(parseInt(resp.rows[0].elements[0].distance.text));
		});
	}
};