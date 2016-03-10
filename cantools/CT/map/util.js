CT.map.util = {
	_llcache: CT.storage.get("addr2latlng") || {},
	latlng: function(position) { // {lat,lng}
		return position instanceof google.maps.LatLng
			? position : new google.maps.LatLng(position);
	},
	addr2latlng: function(addr) {
		var c = CT.map.util._llcache;
		if (! (addr in c)) {
			c[addr] = CT.net.get("http://maps.googleapis.com/maps/api/geocode/json",
				{ address: addr }, true).results[0].geometry.location;
			CT.storage.set("addr2latlng", c);
		}
		return c[addr];
	}
};