CT.canvas.Canvas = CT.Class({
	"_": {
		"controllers": {}, // for different types of view nodes
		"propagate": function(ename, args) {
			this.log("propagate", ename, args);
			var _c = this._.vars.controllers, cname, c, rval;
			for (cname in _c) {
				c = _c[controller];
				rval = c[ename].apply(c, args) || rval;
			}
			return rval;
		},
		"on": {
			"up": function() {
				this.log("up");
				this._.propagate("up");
			},
			"hover": function(pos) {
				this.log("hover");
				this._.propagate("hover", [this._.where(pos)]);
			},
			"down": function(pos) {
				this.log("down");
				this.canvas.noDrag = this._.propagate("down", [this._.where(pos)]);
			},
			"drag": function(dir, dist, dx, dy, dt) {
				this.log("drag");
				this._.propagate("drag", [dir, dist, dx, dy, dt]);
			}
		}
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
		this._.controllers.forEach(function(c) {
			c.draw(this._.ctx);
		}.bind(this));
	},
	"render": function() {
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
	},
	"register": function(name, controller) {
		var _v = this._.vars,
			_co = this._.controllers,
			_ca = this.canvas;
		_co[name] = controller;
		_v.width = _ca.width = Math.max(_v.width, controller.dimensions.width);
		_v.height = _ca.height = Math.max(_v.height, controller.dimensions.height);
	},
	"init": function() {
		this.log = CT.log.getLogger("Canvas");
		var _v = this._.vars = CT.merge(this._.vars, {
			"width": CT.align.width(_v.view), // if no view, measures window
			"height": CT.align.height(_v.view)
		});
		this.view = _v.view;
	}
});