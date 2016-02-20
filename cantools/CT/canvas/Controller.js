CT.canvas.Controller = CT.Class({
	"CLASSNAME": "CT.canvas.Controller",
	"INPUT": true,
	"DRAGGABLE": false,
	"_": {
		"propagate": function(ename, args) {
			var rval;
			if (this.INPUT) this.nodes.forEach(function(n) {
				rval = n[ename].apply(n, args)  && n || rval;
			});
			return rval;
		}
	},
	"up": function() {
		this.log("up");
		this.selected = null;
		return this._.propagate("up");
	},
	"hover": function(pos) {
		this.log("hover");
		return this._.propagate("hover", [pos]);
	},
	"down": function(pos) {
		this.log("down");
		this.selected = this._.propagate("down", [pos]);
		return this.selected;
	},
	"drag": function(dir, dist, dx, dy, dt) {
		this.log("drag");
		if (this.selected && this.DRAGGABLE)
			this.selected.move(dx, dy);
			return true;
		}
	},
	"get": function(name) {
		return this.nodes[name];
	},
	"draw": function(ctx) {
		this.nodes.forEach(function(n) {
			n.draw(ctx);
		});
	},
	"init": function(vars) {
		this._.vars = vars;
		this.nodes = vars.nodes;
	}
});
