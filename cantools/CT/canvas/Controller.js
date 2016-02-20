CT.canvas.Controller = CT.Class({
	"CLASSNAME": "CT.canvas.Controller",
	"INPUT": true,
	"DRAGGABLE": false,
	"_": {
		"on": {
			"up": function(node) {
				this.log("up callback");
			},
			"hover": function(node) {
				this.log("hover callback");
			},
			"down": function(node) {
				this.log("down callback");
			},
			"drag": function(node) {
				this.log("drag callback");
			}
		},
		"propagate": function(ename, args) {
			var rval;
			if (this.INPUT) this.nodes.forEach(function(n) {
				rval = n[ename].apply(n, args)  && n || rval;
			});
			if (rval)
				this._.on[ename](rval);
			return rval;
		}
	},
	"on": function(evt, cb) {
		this._.on[evt] = cb;
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
