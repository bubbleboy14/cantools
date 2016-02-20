CT.canvas.Text = CT.Class({
	"CLASSNAME": "CT.canvas.Text",
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
				} else {
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