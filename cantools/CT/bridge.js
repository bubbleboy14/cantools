/*
This module provides a postMessage bridge between a vanilla
javascript application and a generic CT-style widget.
*/

var merge = function() { // CT.merge()
	var i, k, o = {};
	for (i = arguments.length - 1; i > -1; i--)
		if (arguments[i])
			for (k in arguments[i])
				o[k] = arguments[i][k];
	return o;
};

window.PMB = {
	_: {
		bridges: [],
		sourceBridge: function(event) {
			var _ = PMB._, bridges = _.bridges, i, b;
			for (i = 0; i < bridges.length; i++) {
				b = bridges[i];
				if (event.source == b.iframe.contentWindow) // better way?
					return b;
			}
		},
		bareSend: function(bridge, data) {
			bridge.iframe.contentWindow.postMessage(data, bridge.iframe._targetOrigin);
		},
		send: function(bridge, action, data) {
			PMB._.bareSend(bridge, {
				action: action,
				data: data
			});
		},
		sender: function(action, bridge) {
			return function(data) {
				if (bridge.ready)
					PMB._.send(bridge, action, data);
				else
					bridge.pending.push({ action: action, data: data });
			};
		},
		puller: function(event) {
			var d = event.data,
				bridge = PMB._.sourceBridge(event);
			bridge && (d.action in bridge.opts.receivers) && bridge.opts.receivers[d.action](d.data);
		},
		iframe: function(opts) {
			var ifr = document.createElement("iframe"),
				loc = PMB._.location();
			ifr._targetOrigin = loc;
			ifr.src = loc + opts.widget;
			if (opts.node) {
				if (opts.hash)
					ifr.src += "#" + opts.hash;
				ifr.style.border = "0";
				ifr.style.width = ifr.style.height = "100%";
			} else
				ifr.style.visibility = "hidden";
			(opts.node || document.body).appendChild(ifr);
			return ifr;
		},
		location: function() {
			var i, p, s = document.getElementsByTagName("script"),
				flag = "/CT/bridge.js", flen = flag.length;
			for (i = 0; i < s.length; i++) {
				p = s[i].src;
				if (p.endsWith(flag))
					return p.slice(0, p.indexOf("/", 8))
			}
		}
	},
	bridge: function(opts) {
		PMB.init();
		opts = merge(opts, {
			senders: ["send"],     // sending functions (to attach to bridge)
			receivers: {},         // callbacks functions
			hash: null,            // if widget pays attention to hashes
			node: null,            // else, iframe is invisible
			widget: null           // required! e.g. /map/widget.html
		});
		var _ = PMB._, b = {
			opts: opts,
			pending: [],
			iframe: _.iframe(opts)
		};
		b.iframe.onload = function() {
			b.ready = true;
			opts.data ? _.bareSend(b, data) : _.send(b, "ping"); // warms up the connection...
			b.pending.forEach(function(p) {
				_.send(b, p.action, p.data);
			});
		};
		opts.senders.forEach(function(sender) {
			b[sender] = _.sender(sender, b);
		});
		_.bridges.push(b);
		return b;
	},
	init: function() {
		if (!PMB._.initialized) {
			PMB._.initialized = true;
			window.addEventListener("message", PMB._.puller);
		}
	}
};