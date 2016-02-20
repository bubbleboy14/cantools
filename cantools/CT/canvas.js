CT.canvas = {};

CT.canvas.Canvas = CT.Class({

});

CT.canvas.Node = CT.Class({
	"_": {
		"mids": function() {
			var _v = this._.vars;
			_v.mids = {};
			_v.mids.x = _v.x + (_v.width / 2);
			_v.mids.y = _v.y + (_v.height / 2);
		},
		"draw_box": function (ctx) {
			var _v = this._.vars, gradient,
				x = _v.x, y = _v.y, r = _v.radius,
				width = _v.width, height = _v.height,
				lineWidth = _v.over ? (2 * _v.border) : _v.border,
				radius = {tl: r, tr: r, br: r, bl: r};
			ctx.strokeStyle = _v.selected ? _v.color_selected : _v.color_unselected;
			ctx.lineWidth = _v.selected ? (2 * lineWidth) : lineWidth;
			ctx.beginPath();
			ctx.moveTo(x + radius.tl, y);
			ctx.lineTo(x + width - radius.tr, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
			ctx.lineTo(x + width, y + height - radius.br);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
			ctx.lineTo(x + radius.bl, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
			ctx.lineTo(x, y + radius.tl);
			ctx.quadraticCurveTo(x, y, x + radius.tl, y);
			ctx.closePath();

			gradient = ctx.createLinearGradient(x, y, x, y + height);
			gradient.addColorStop(0, "white");
			gradient.addColorStop(1, _v.color);
			ctx.fillStyle = gradient;

			ctx.shadowColor = "#99AAAA";
			ctx.shadowBlur = 10;
			ctx.shadowOffsetX = 4;
			ctx.shadowOffsetY = 4;

			ctx.fill();
			ctx.stroke();
		}
	},
	"components": {},
	"move": function(x, y) {
		this._.vars.x += x;
		this._.vars.y += y;
		this._.mids();
	},
	"contains": function(e) {
		var x = this._.vars.x,
			y = this._.vars.y,
			w = this._.vars.width,
			h = this._.vars.height;
		return ((e.x >= x) && (e.x <= x + w) &&
			(e.y >= y) && (e.y <= y + h));
	},
	"hover": function(e) {
		this._.vars.over = this.contains(e) ? true : false;
	},
	"up": function(e) {
	},
	"down": function(e) {
		this._.vars.selected = this.contains(e);
		return this._.vars.selected;
	},
	"draw": function(ctx) {
		this._.draw_box(ctx);
		for (var c in this.components)
			this.components[c](ctx);
	},
	"init": function(vars) {
		this.id = CT.canvas.Node.id;
		CT.canvas.Node.id += 1;
		this.log = CT.log.getLogger("CT.canvas.Node(" + this.id + ")");
		this._.vars = CT.merge(vars, {
			"border": 1,
			"radius": 5,
			"over": false,
			"selected": false,
			"color_selected": "red",
			"color_unselected": "#0023AA"
		});
		this._.mids()
	}
});
CT.canvas.Node.id = 0;

CT.canvas.Text = CT.Class({
	"components": {
		"text": function(ctx) {
			var _v = this._.vars, i = 0,
				line = '', lines = [],
				x = _v.x + _v.padding,
				y = _v.y + _v.padding,
				width = _v.width - _v.padding * 2,
				height = _v.height - _v.padding * 2
				lineHeight = _v.lineHeight,
				words = _v.label.split(' '),
				yStart, xStart, lastMetrics, 
				testLine, metrics, testWidth;
			ctx.shadowColor = _v.shadowColor;
			ctx.shadowBlur = _v.shadowBlur;
			ctx.shadowOffsetX = _v.shadowOffsetX;
			ctx.shadowOffsetY = _v.shadowOffsetY;
			ctx.fillStyle = _v.fillStyle;
			ctx.textBaseline = _v.textBaseline;
			for (; i < words.length; ++i) {
				testLine = !line ? words[i] : line + ' ' + words[i];
				metrics = ctx.measureText(testLine);
				lastMetrics = lastMetrics || metrics;
				testWidth = metrics.width;
				if (testWidth > width && i > 0) {
					xStart = x + (width - lastMetrics.width) / 2;
					lines.push({
							"line": line,
							"xStart": xStart
						});
					line = words[i];
					lastMetrics = ctx.measureText(line);
				}else {
					lastMetrics = metrics;
					line = testLine;
				}
				if (i == words.length - 1) {
					lastMetrics = ctx.measureText(line);
					xStart = x + (width - lastMetrics.width) / 2;
					lines.push({
							"line": line,
							"xStart": xStart
						});
				}
			}
			yStart = y + (height - lineHeight * lines.length) / 2;
			ctx.font = "Bold 8pt Sans-Serif";
			lines.forEach(function(l) {
				ctx.fillText(l.line, l.xStart, yStart);
				yStart += lineHeight;
			});
		}
	},
	"init": function() {
		this._.vars = CT.merge(this._.vars, {
			"padding": 7,
			"lineHeight": 12,
			"fillStyle": "black",
			"textBaseline": "top",
			"shadowColor": "none",
			"shadowBlur": 0,
			"shadowOffsetX": 0,
			"shadowOffsetY": 0
		});
		this._.vars.label = this._.vars.label.replace(/(?:\r\n|\r|\n)/g, ' ');
	}
}, CT.canvas.Node);