CT.admin.monitor = {
	"snapshot": function() {
		var names = [], vals = [], lz = CT.admin.monitor._logs;
		lz.forEach(function(log, i) {
			names.push(log[0] + " (" + log[1].length + ")");
			vals.push(i);
		});
		var s1 = CT.dom.select(names, vals),
			s2 = CT.dom.select(names, vals);
		var mod = new CT.modal.Modal({
			transition: "slide",
			content: [
				"Start?", s1, "End?", s2,
				CT.dom.button("Go", function() {
					var vz = s1.value + s2.value;
					mod.hide();
					(new CT.modal.Modal({
						transition: "slide",
						slide: { origin: "bottom" },
						className: "basicpopup unlimited h4-5 w4-5",
						content: [
							CT.dom.div(names[s1.value].slice(13) + " - " + names[s2.value].slice(13),
								"biggest bold centered"),
							CT.dom.div(null, "ct-chart ct-perfect-fourth", "graph" + vz),
							CT.dom.div(null, "centered", "legend" + vz),
							CT.dom.div(null, "abs ctr", "web_totals" + vz),
							CT.dom.div(null, "abs ctl", "admin_totals" + vz)
						]
					})).show(null, function() {
						var graph = new CT.admin.monitor.Graph({
							graph: "graph" + vz,
							legend: "legend" + vz,
							web_totals: "web_totals" + vz,
							admin_totals: "admin_totals" + vz
						});
						lz.slice(parseInt(s1.value), parseInt(s2.value) + 1).forEach(function(ldata) {
							var lpath = ldata[0], lhours = ldata[1];
							lhours.forEach(function(hour) {
								CT.net.get("/" + lpath + "/" + hour).split("\n").forEach(function(log) {
									log && graph.update({ message: JSON.parse(log) });
								});
							});
						});
					});
				})
			]
		});
		mod.show();
	},
	"init": function() {
		CT.admin.core.init("monitor", function(data) {
			CT.admin.monitor._graph = new CT.admin.monitor.Graph();
			CT.pubsub.set_autohistory(true);
			CT.pubsub.set_cb("message", CT.admin.monitor._graph.update);
			CT.pubsub.subscribe("monitor");
			CT.pubsub.connect(data.host, data.port,
				"__admin__" + Math.floor(Math.random() * 1000) + btoa(CT.admin.core._pw));
			data.logs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
			CT.admin.monitor._logs = data.logs;
			CT.admin.monitor._cache = {};
			if (data.logs) {
				var snap = CT.dom.id("snapshot");
				snap.onclick = CT.admin.monitor.snapshot;
				CT.dom.show(snap);
			}
		});
	}
};

CT.admin.monitor.Graph = CT.Class({
	CLASSNAME: "CT.admin.monitor.Graph",
	_graph: function() {
		new Chartist.Line("#" + this.opts.graph, {
			series: Object.values(this.data)
		}, { low: 0, high: 100 });
	},
	update: function(data) {
		var key, d, tcat, fresh = !Object.keys(this.data).length;
		for (key in data.message) {
			d = data.message[key];
			if (key == "totals") {
				for (tcat in d) {
					CT.dom.setContent(this.opts[tcat + "_totals"], Object.keys(d[tcat]).map(function(cname) {
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
			}), graph = CT.dom.id(this.opts.graph);
			CT.dom.addContent(this.opts.legend, lines);
			setTimeout(function() {
				CT.dom.className("ct-line", graph).forEach(function(n, i) {
					lines[i].style.background
						= window.getComputedStyle(n).getPropertyValue("stroke");
				});
			}, 200);
		}
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			data: {},
			graph: "graph",
			legend: "legend",
			web_totals: "web_totals",
			admin_totals: "admin_totals"
		});
		this.data = opts.data;
	}
});