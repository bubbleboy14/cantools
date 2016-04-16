CT.map.Shape = CT.Class({
	CLASSNAME: "CT.map.Shape",
	_gclass: function() {
		var cname = this.CLASSNAME.split(".")[2];
		return {
			Shape: "Polygon",
			Line: "Polyline"
		}[cname] || cname;
	},
	add: function(map) {
		this.opts.map = map;
		this.shape.setMap(map);
	},
	remove: function() {
		this.opts.map = null;
		this.shape.setMap(null);
	},
	init: function(opts) {
		this.opts = opts;
		this.shape = new google.maps[this._gclass()](opts);
		if (opts.map)
			this.add(opts.map);
	}
});

CT.map.Circle = CT.Class({
	CLASSNAME: "CT.map.Circle"
}, CT.map.Shape);

CT.map.Rectangle = CT.Class({
	CLASSNAME: "CT.map.Rectangle"
}, CT.map.Shape);

CT.map.Line = CT.Class({
	CLASSNAME: "CT.map.Line"
}, CT.map.Shape);