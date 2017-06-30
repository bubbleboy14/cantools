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
			data.logs = data.logs || [];
			data.logs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });
			data.logs.forEach(function(day) {
				day[1].sort(function(a, b) { return parseInt(a) < parseInt(b) ? -1 : 1; });
			});
			CT.admin.monitor._logs = data.logs;
			CT.admin.monitor._cache = {};
			if (data.logs.length) {
				var snap = CT.dom.id("snapshot");
				snap.onclick = CT.admin.monitor.snapshot;
				CT.dom.show(snap);
			}
			if (data.geo) {
				CT.setVal("mapkey", CT.data.choice(data.geo));
				CT.require("CT.parse", true);
				CT.require("CT.storage", true);
				CT.require("CT.map", true);
				CT.map.util.setGeoKeys(data.geo);
				CT.admin.monitor._graph.enableMaps();
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
	_pie: function(data) {
		var subd, ua, combined = {};
		for (subd in data) {
			for (ua in data[subd]) {
				if (ua.startsWith("python-requests")) // filter these out
					continue;
				if (!(ua in combined))
					combined[ua] = 0;
				combined[ua] += data[subd][ua];
			}
		}
		new Chartist.Pie("#" + this.opts.pie, {
			labels: Object.keys(combined),
			series: Object.values(combined)
		});
	},
	_mapButton: function(category) {
		var that = this;
		CT.dom.addContent("map_buttons", CT.dom.button(category + " map", function() {
			CT.dom.show("map_node");
			CT.dom.clear("map");
			var ips = {},
				llz = {},
				ipz = Object.keys(that._ips[category]);
			/*
			Much of the following should be moved into CT.map.util / configuration.
			*/
			CT.net.post({
				path: location.protocol + "//api.mkult.co/geo",
				params: { action: "ips", ips: ipz },
				cb: function(data) {
					ipz.forEach(function(ip, i) {
						var d = ips[ip] = data[i],
							count = that._ips[category][ip],
							llkey = d.latitude + ", " + d.longitude;
						if (d.location == "unknown")
							return;
						if (!llz[llkey])
							llz[llkey] = { total: 0 };
						llz[llkey][ip] = count;
						llz[llkey].total += count;
					});
					var map = new CT.map.Map({
						node: CT.dom.id("map"),
						markers: Object.keys(llz).map(function(ll) {
							var parts = ll.split(", "),
								lat = parseFloat(parts[0]),
								lng = parseFloat(parts[1]);
							return {
								title: ll + " (" + llz[ll].total  + ")",
								position: {
									lat: lat,
									lng: lng
								}
							}
						})
					});
				}
			});
		}, "margined"));
	},
	enableMaps: function() {
		this._mapsEnabled = true;
		CT.dom.id("map_close").onclick = function() {
			CT.dom.hide("map_node");
		};
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
			if (key == "devices" || key == "ips")
				continue; // handle below
			if (!(key in this.data))
				this.data[key] = [];
			if (["read", "write"].indexOf(key) != -1)
				d /= 10000;
			else if (["sent", "recv"].indexOf(key) != -1)
				d /= 100000000;
			this.data[key].push(d);
		}
		this._graph();
		this._pie(data.message.devices);
		this._ips = data.message.ips;
		if (fresh) {
			var hovers = this.hovers = {};
			var labels = Object.keys(this.data).map(function(k) {
				var hover = hovers[k] = CT.dom.div();
				if (["read", "write"].indexOf(k) != -1)
					k += " (X 10,000)";
				else if (["sent", "recv"].indexOf(k) != -1)
					k += " (X 100,000,000)";
				var n = CT.dom.div(k, "big m5 padded inline-block pointer");
				CT.hover.set(n, hover);
				return n;
			}), graph = CT.dom.id(this.opts.graph);
			CT.dom.addContent(this.opts.legend, labels);
			setTimeout(function() {
				CT.dom.className("ct-line", graph).forEach(function(n, i) {
					labels[i].style.background
						= window.getComputedStyle(n).getPropertyValue("stroke");
				});
			}, 200);
			if (this._mapsEnabled)
				for (key in data.message.ips)
					this._mapButton(key);
		}
		for (var k in this.hovers)
			CT.dom.setContent(this.hovers[k], data.message[k]);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			data: {},
			pie: "pie",
			graph: "graph",
			legend: "legend",
			web_totals: "web_totals",
			admin_totals: "admin_totals"
		});
		this.data = opts.data;
	}
});