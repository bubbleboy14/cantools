CT.canvas.Controller = CT.Class({
	"CLASSNAME": "CT.canvas.Controller",
	"nodes": [],
	"nodesByName": {},
	"_": {
		"on": { // override these w/ controller.on(ename, cb)
			"up": function(node) {},
			"hover": function(node) {},
			"down": function(node) {},
			"drag": function(node) {}
		},
		"propagate": function(ename, args) {
			var rval;
			if (this._.vars.input) this.nodes.forEach(function(n) {
				rval = n[ename].apply(n, args)  && n || rval;
			});
			if (rval)
				this._.on[ename](rval);
			return rval;
		},
		bounds: function(normalize) {
			var n, padding = this._.vars.padding,
				endNodeX, endNodeY,
				maxX = maxY = minX = minY = 0;
			this.nodes.forEach(function(node) {
				n = node._.vars;
				endNodeX = n.x + n.width;
				endNodeY = n.y + n.height;
				if (maxX < endNodeX + padding)
					maxX = endNodeX + padding;
				if (maxY < endNodeY + padding)
					maxY = endNodeY + padding;
				if (minX == 0 || (n.x - padding) < minX)
					minX = n.x - padding;
				if (minY == 0 || (n.y - padding) < minY)
					minY = n.y - padding;
			});
			normalize && this.nodes.forEach(function(n) {
				n.move(-minX, -minY);
			});
			this._.vars.width = maxX - minX;
			this._.vars.height = maxY - minY;
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
		this.selected = null;
		return this._.propagate("up");
	},
	"hover": function(pos) {
		return this._.propagate("hover", [pos]);
	},
	"down": function(pos) {
		this.selected = this._.propagate("down", [pos]);
		return this.selected;
	},
	"drag": function(dir, dist, dx, dy, dt) {
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
		this.nodesByName[n._.vars.name] = n;
	},
	"rmNode": function(n) {
		CT.data.remove(this.nodes, n);
		delete this.nodesByName[n.name];
	},
	"init": function(vars) {
		var v = this._.vars = CT.merge(vars, {
			"input": true,
			"draggable": true,
			"normalize": true,
			"padding": 5
		});
		v.nodes.forEach(this.addNode);
		if (v.dimensions) {
			v.width = v.dimensions.width;
			v.height = v.dimensions.height;
			delete v.dimensions;
		} else
			this._.bounds(v.normalize);
	}
});
