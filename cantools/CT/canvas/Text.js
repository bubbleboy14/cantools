CT.canvas.Text = CT.Class({
	"CLASSNAME": "CT.canvas.Text",
	"components": {
		"text": function(ctx) {
			var _v = this._.vars, i = 0,
				line = '', lines = [],
				x = _v.x + _v.padding,
				y = _v.y + _v.padding,
				width = _v.width - _v.padding * 2,
				height = _v.height - _v.padding * 2,
				lineHeight = _v.lineHeight,
				words = _v.label.split(' '),
				yStart, xStart, lastMetrics, 
				testLine, metrics, testWidth;
			ctx.shadowColor = _v.textShadowColor;
			ctx.shadowBlur = _v.textShadowBlur;
			ctx.shadowOffsetX = _v.textShadowOffsetX;
			ctx.shadowOffsetY = _v.textShadowOffsetY;
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
			ctx.font = _v.font;
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
			"textShadowColor": "none",
			"textShadowBlur": 0,
			"textShadowOffsetX": 0,
			"textShadowOffsetY": 0,
			"font": "Bold 8pt Sans-Serif"
		});
		this._.vars.label = this._.vars.label.replace(/(?:\r\n|\r|\n)/g, ' ');
	}
}, CT.canvas.Node);