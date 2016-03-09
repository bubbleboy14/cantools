CT.map.DOMMarker = CT.Class({
	CLASSNAME: "CT.map.DOMMarker",
	setTitle: function(title) {
		this.opts.title = title;
		if (this.title)
			this.title.setContent(title);
		else
			this._build();
	},
	setIcon: function(icon) {
		if (typeof icon == "string")
			icon = CT.dom.img(icon);
		this.setContent(icon);
	},
	setMap: function(map) {
		this.opts.map = map;
		this.overlay.setMap(map);
	},
	_build: function() {
		if (this.opts.title) {
			this.title = new CT.map.Node(CT.merge(this.opts.hover, {
				map: this.opts.map,
				content: this.opts.title,
				position: this.getPosition(),
				className: "tooltip"
			}));
		}
	},
	init: function() {
		this.opts = CT.merge(this.opts, {
			className: "abs pointer"
		});
		this.addUpdater("map", this.setMap);
		this.addUpdater("icon", this.setIcon);
		this.addUpdater("title", this.setTitle);
		this._build();
	}
}, CT.map.Node);

CT.map.Marker = CT.Class({
	CLASSNAME: "CT.map.Marker",
	_converters: {
		position: CT.map.latlng
	},
	add: function(map) {
		this.opts.map = map;
		this.marker.setMap(map);
	},
	remove: function() {
		this.opts.map = null;
		this.marker.setMap(null);
	},
	update: function(opts) {
		this.opts = CT.merge(opts, this.opts);
	},
	showInfo: function() {
		var iw = this._infoWindow = this._infoWindow
			|| new google.maps.InfoWindow();
		iw.setContent(this.opts.info);
		iw.setPosition(this.getPosition());
		iw.open(this.opts.map);
	},
	hideInfo: function() {
		this._infoWindow.close();
	},
	_wrap: function(k) {
		var m = this, kup = CT.parse.capitalize(k);
		this["get" + kup] = function() {
			return m.opts[k];
		};
		this["set" + kup] = function(val) {
			m.opts[k] = m._converters[k] ? m._converters[k](val) : val;
			m.marker["set" + kup](m.opts[k]);
		};
	},
	_buildWrappers: function() {
		["title", "icon", "map", "content", "position", "visible"].forEach(this._wrap);
	},
	_addMarkerListener:  function(evt, cb) { // gmMarker only
		google.maps.event.addListener(this.marker, evt, cb);
	},
	_buildMarker: function() {
		this.marker = new google.maps.Marker(this.opts);
		for (var evt in this.opts.listeners)
			this._addMarkerListener(evt, this.opts.listeners[evt]);
	},
	_buildCustomMarker: function() {
		this.marker = new CT.map.DOMMarker(this.opts);
	},
	init: function(opts) {
		// required: position{lat,lng}
		// suggested: title"", map
		// if content, build custom dom marker
		this.opts = opts = CT.merge(opts, {
			icon: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
			listeners: opts.info && { click: this.showInfo } || {}
		});
		opts.position = CT.map.latlng(opts.position);
		opts.content ? this._buildCustomMarker() : this._buildMarker();
		this._buildWrappers();
		if (this.opts.map)
			this.add(this.opts.map);
	}
});
