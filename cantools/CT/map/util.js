CT.map.util = {
	_try_limit: 20,
	_llcache: CT.storage.get("addr2latlng") || {},
	_try_a2ll: function(addr) {
		var tries = 0, res;
		while( tries < CT.map.util._try_limit && !res ) {
			res = CT.net.get("http://maps.googleapis.com/maps/api/geocode/json",
				{ address: addr }, true).results[0];
			if (res) return res
			tries += 1;
			CT.log("CT.map.util.addr2latlng: can't find " + addr + " - trying again! tries: " + tries);
		}
	},
	_geo_fallback: { lat: 37.75, lng: -122.45 },
	setGeoFallback: function(pos) {
		CT.map.util._geo_fallback = pos;
	},
	getGeoFallback: function() {
		return CT.map.util._geo_fallback;
	},
	latlng: function(position) { // {lat,lng}
		return position instanceof google.maps.LatLng
			? position : new google.maps.LatLng(position);
	},
	addr2latlng: function(addr) {
		var c = CT.map.util._llcache;
		if (! (addr in c)) {
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