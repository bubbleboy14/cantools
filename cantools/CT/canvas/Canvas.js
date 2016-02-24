CT.canvas.Canvas = CT.Class({
	"CLASSNAME": "CT.canvas.Canvas",
	"_": {
		"controllers": {}, // for different types of view nodes
		"propagate": function(ename, args) {
			var _c = this._.vars.controllers, cname, c, rval;
			for (cname in _c) {
				c = _c[cname];
				rval = c[ename].apply(c, args) || rval;
			}
			return rval;
		},
		"on": {
			"up": function() {
				this._.propagate("up");
			},
			"hover": function(pos) {
				this._.propagate("hover", [this._.where(pos)]);
			},
			"down": function(pos) {
				this.canvas.noDrag = this._.propagate("down", [this._.where(pos)]);
			},
			"drag": function(dir, dist, dx, dy, dt) {
				this._.propagate("drag", [dir, dist, dx, dy, dt]);
			}
		},
		"where": function(e) {
			var xo = this.canvas.offsetLeft + this.view.offsetLeft,
				yo = this.canvas.offsetTop + this.view.offsetTop;
			return {
				x: e.x + this.view.scrollLeft - xo,
				y: e.y + this.view.scrollTop - yo
			};
		}
	},
	"draw": function(dt) {
		this._.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (var k in this._.controllers)
			this._.controllers[k].draw(this._.ctx);
	},
	"render": function() {
		if (!this.canvas) return;
		requestAnimationFrame(this.render);
		var now = new Date().getTime(),
			deltaTime = now - (this.startTime || now);

		this.startTime = now;
		this.draw(deltaTime);
	},
	"dismantle": function() {
		if (this.canvas) {
			CT.gesture.unlisten('hover', this.canvas);
			CT.gesture.unlisten('drag', this.canvas);
			CT.gesture.unlisten('down', this.canvas);
			CT.gesture.unlisten('up', this.canvas);
			CT.dom.remove(this.canvas);
			this.canvas = null;
		}
	},
	"build": function() {
		this.canvas = CT.dom.node("", "canvas", "", "", {
			"width": this._.vars.width,
			"height": this._.vars.height
		});
		this._.ctx = this.canvas.getContext('2d');
		CT.gesture.listen('hover', this.canvas, this._.on.hover);
		CT.gesture.listen('drag', this.canvas, this._.on.drag);
		CT.gesture.listen('down', this.canvas, this._.on.down);
		CT.gesture.listen('up', this.canvas, this._.on.up);
		this._.vars.zoom && CT.gesture.pinch2zoom(this.canvas);
	},
	"register": function(name, controller) {
		var _v = this._.vars,
			_co = this._.controllers,
			_d = controller.getDimensions();
		_co[name] = controller;
		_v.width = Math.max(_v.width, _d.width);
		_v.height = Math.max(_v.height, _d.height);
		if (this.canvas) {
			this.canvas.width = _v.width;
			this.canvas.height = _v.height;
		}
	},
	"init": function(vars) {
		this._.vars = CT.merge(vars, {
			"width": CT.align.width(vars.view), // if no view, measures window
			"height": CT.align.height(vars.view),
			"controllers": {},
			"zoom": false // disabled until integration is improved
		});
		for (var cname in this._.vars.controllers)
			this.register(cname, this._.vars.controllers[cname]);
		this.view = this._.vars.view;
		this.build();
	}
});