CT.canvas.Controller = CT.Class({
	"CLASSNAME": "CT.canvas.Controller",
	"nodes": [],
	"nodesByName": {},
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
			if (this._.vars.input) this.nodes.forEach(function(n) {
				rval = n[ename].apply(n, args)  && n || rval;
			});
			if (rval)
				this._.on[ename](rval);
			return rval;
		}
	},
	"getDimensions": function() {
		return {
			"width": this._.vars.width,
			"height": this._.vars.height
		};
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
		if (this.selected && this._.vars.draggable) {
			this.selected.move(dx, dy);
			return true;
		}
	},
	"get": function(name) {
		return this.nodesByName[name];
	},
	"draw": function(ctx) {
		this.nodes.forEach(function(n) {
			n.draw(ctx);
		});
	},
	"addNode": function(n) {
		this.nodes.push(n);
		this.nodesByName[n.name] = n;
	},
	"rmNode": function(n) {
		CT.data.remove(this.nodes, n);
		delete this.nodesByName[n.name];
	},
	"init": function(vars) {
		this._.vars = CT.merge(vars, {
			"input": true,
			"draggable": true
		});
		vars.nodes.forEach(this.addNode);
	}
});
