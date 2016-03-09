CT.map.Node = CT.Class({
	CLASSNAME: "CT.map.Node",
	_regEvt: function(evt) {
		if (this.opts[evt])
			google.maps.event.addDomListener(this.content, evt, this.opts[evt]);
	},
	_add: function() {
		this.content = CT.dom.node(this.opts.content, "div", this.opts.className);
		this.projection = this.overlay.getProjection();
		CT.dom.setContent(this.overlay.getPanes().floatPane, this.content);
		Object.keys(handers).forEach(this._regEvt);
	},
	_remove: function() {
		google.maps.event.clearListeners(this.content);
		CT.dom.remove(this.content);
		this.content = null;
	},
	_draw: function() {
		if (!this.content || !this.opts.visible) return;
		var point = this.projection.fromLatLngToDivPixel(this.opts.position);
		this.content.style.left = point.x + "px";
		this.content.style.top = point.y + "px";
	},
	getPosition: function() {
		return this.opts.position;
	},
	setPosition: function(latlng) {
		this.opts.position = latlng;
		this._draw();
	},
	setVisible: function(vis) {
		this.opts.visible = vis;
		if (this.content) {
			this.content.style.display = vis ? "block" : "none";
			this._draw();
		}
	},
	setContent: function(content) {
		this.opts.content = content;
		if (this.content)
			CT.dom.setContent(this.content, content);
	},
	setHandlers: function(handlers) { // click, mouseover, mouseout
		this.opts.handlers = handlers;
		if (this.content) {
			google.maps.event.clearListeners(this.content);
			Object.keys(handlers).forEach(this._regEvt);
		}
	},
	addUpdater: function(property, cb) {
		this.opts.updaters[property] = cb;
	},
	update: function(opts) {
		var o = this.opts = CT.merge(opts, this.opts);
		if ("visible" in opts)
			this.setVisible(opts.visible);
		if (opts.position)
			this.setPosition(opts.position);
		if (opts.content)
			this.setContent(opts.content);
		if (opts.handlers)
			this.setHandlers(opts.handlers);
		Object.keys(o.updaters).forEach(function(uprop) {
			if (uprop in opts)
				o.updaters[uprop](opts[uprop]);
		});
	},
	show: function() {
		this.overlay.setMap(this.opts.map);
	},
	hide: function() {
		this.overlay.setMap(null);
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			visible: true,
			updaters: {}
		});
		this.overlay = new google.maps.OverlayView();
		this.overlay.onAdd = this._add;
		this.overlay.onRemove = this._remove;
		this.overlay.draw = this._draw;
	}	
});