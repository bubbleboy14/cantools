CT.map.util = {
	_try_limit: 20,
	_llcache: CT.storage.get("addr2latlng") || {},
	_keys: [],
	_kindex: 0,
	_get_res: function(addr) {
		var params = { address: addr },
			k = CT.map.util._keys[CT.map.util._kindex];
		if (k) {
			params.key = k;
			CT.map.util._kindex += 1;
		} else
			CT.map.util._kindex = 0;
		return CT.net.get("https://maps.googleapis.com/maps/api/geocode/json", params, true).results[0];
	},
	_try_a2ll: function(addr) {
		var tries = 0, res, key;
		while( tries < CT.map.util._try_limit && !res ) {
			res = CT.map.util._get_res(addr);
			if (res) return res
			tries += 1;
			CT.log("CT.map.util.addr2latlng: can't find " + addr + " - trying again! tries: " + tries);
		}
	},
	_geo_fallback: { lat: 37.75, lng: -122.45 },
	setGeoKeys: function(keys) {
		CT.map.util._keys = keys;
	},
	setGeoFallback: function(pos) {
		CT.map.util._geo_fallback = pos;
	},
	getGeoFallback: function() {
		return CT.map.util._geo_fallback;
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
		var c = CT.map.util._llcache;
		if (!c[addr]) {
			c[addr] = CT.map.util._try_a2ll(addr).geometry.location;
			CT.storage.set("addr2latlng", c);
		}
		return c[addr];
	},
	bounds: function(sw, ne) {
		return new google.maps.LatLngBounds(CT.map.util.latlng(sw),
			CT.map.util.latlng(ne));
	}
};