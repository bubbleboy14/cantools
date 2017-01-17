CT.admin.monitor = {
	"init": function() {
		CT.admin.core.init("monitor", function(loc) {
			CT.admin.monitor._graph = new CT.admin.monitor.Graph();
			document.body.appendChild(CT.admin.monitor._graph.content);
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
		var lines = this.lines;
		new Chartist.Line(".ct-chart", {
			series: Object.values(this.data)
		}, { low: 0, high: 100 });
		setTimeout(function() {
			CT.dom.className("ct-line").forEach(function(n, i) {
				lines[i].style.background
					= window.getComputedStyle(n).getPropertyValue("stroke");
			});
		});
	},
	update: function(data) {
		var key, d, fresh = !Object.keys(this.data).length;
		for (key in data.message) {
			if (!(key in this.data))
				this.data[key] = [];
			d = data.message[key];
			if (["read", "write"].indexOf(key) != -1)
				d /= 10000;
			else if (["sent", "recv"].indexOf(key) != -1)
				d /= 100000000;
			this.data[key].push(d);
		}
		CT.dom.clear(this.content);
		if (fresh) {
			this.lines = Object.keys(this.data).map(function(k) {
				if (["read", "write"].indexOf(k) != -1)
					k += " (times 10,000)";
				else if (["sent", "recv"].indexOf(k) != -1)
					k += " (times 100,000,000)";
				return CT.dom.div(k, "big m5 padded inline-block")
			});
			CT.dom.addContent("legend", this.lines);
		}
		this._graph();
	},
	init: function() {
		this.data = {};
		this.content = CT.dom.div(null, "ct-chart ct-perfect-fourth");
	}
});