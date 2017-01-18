CT.admin.monitor = {
	"init": function() {
		CT.admin.core.init("monitor", function(loc) {
			CT.admin.monitor._graph = new CT.admin.monitor.Graph();
			CT.pubsub.set_autohistory(true);
			CT.pubsub.set_cb("message", CT.admin.monitor._graph.update);
			CT.pubsub.subscribe("monitor");
			CT.pubsub.connect(loc.host, loc.port,
				"__admin__" + Math.floor(Math.random() * 1000) + btoa(CT.admin.core._pw));
		});
	}
};

CT.admin.monitor.Graph = CT.Class({
	CLASSNAME: "CT.admin.monitor.Graph",
	_graph: function() {
		new Chartist.Line(".ct-chart", {
			series: Object.values(this.data)
		}, { low: 0, high: 100 });
	},
	update: function(data) {
		var key, d, tcat, fresh = !Object.keys(this.data).length;
		for (key in data.message) {
			d = data.message[key];
			if (key == "totals") {
				for (tcat in d) {
					CT.dom.setContent(tcat + "_totals", Object.keys(d[tcat]).map(function(cname) {
						return d[tcat][cname] + " total " + tcat + " " + cname;
					}));
				}
				continue;
			}
			if (!(key in this.data))
				this.data[key] = [];
			if (["read", "write"].indexOf(key) != -1)
				d /= 10000;
			else if (["sent", "recv"].indexOf(key) != -1)
				d /= 100000000;
			this.data[key].push(d);
		}
		this._graph();
		if (fresh) {
			var lines = Object.keys(this.data).map(function(k) {
				if (["read", "write"].indexOf(k) != -1)
					k += " (X 10,000)";
				else if (["sent", "recv"].indexOf(k) != -1)
					k += " (X 100,000,000)";
				return CT.dom.div(k, "big m5 padded inline-block")
			});
			CT.dom.addContent("legend", lines);
			setTimeout(function() {
				CT.dom.className("ct-line").forEach(function(n, i) {
					lines[i].style.background
						= window.getComputedStyle(n).getPropertyValue("stroke");
				});
			}, 200);
		}
	},
	init: function() {
		this.data = {};
	}
});