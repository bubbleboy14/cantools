/*
This module provides functions that generate common UI elements. These include:

### header(opts) - defaults:
	logo: "Placeholder Logo"
	right: []
	centerLogo: true

### footer(opts) - defaults:
	logo: "Placeholder Logo"
	links: []
	contact: {}

### grid(data, columns, rows, hardheight) - defaults:
	columns: 3
	rows: 4
*/

CT.layout = {
	header: function(opts) {
		opts = CT.merge(opts, {
			logo: "Placeholder Logo",
			right: [],
			centerLogo: true
		});
		var content = [];
		if (opts.right instanceof Node || opts.right.length) {
			if (opts.centerLogo)
				content.push(CT.dom.node(opts.right, "div", "right padded"));
			else
				content.push(CT.dom.node(CT.dom.node(opts.right, "div",
					"right h1", null, null, { padding: "30px" }),
					"div", "abs top0 bottom0 right0 w1-2"));
		}
		if (opts.centerLogo)
			content.push(CT.dom.node(opts.logo, "center", "biggerester"));
		else
			content.push(CT.dom.link(opts.logo, null, "/",
				"w1-2 biggest bold block nodecoration abs top0 bottom0 left0"));
		CT.dom.setContent(CT.dom.id("ctheader"), CT.dom.node(content, "div", "h1 w1"));
	},
	footer: function(opts) {
		opts = CT.merge(opts, {
			logo: "Placeholder Logo",
			links: [],
			contact: {}
		});
		var rights = [], content = [
			CT.dom.link(opts.logo, null, "/", "left nodecoration")
		];
		if (opts.links.length)
			rights.push(opts.links.map(function(link) {
				return CT.dom.link(link.content, link.cb, link.href, "padded");
			}));
		if (opts.contact.email || opts.contact.phone) {
			var contacts = [];
			if (opts.contact.email)
				contacts.push(CT.dom.node(opts.contact.email, "div", "padded inline-block"));
			if (opts.contact.phone)
				contacts.push(CT.dom.node(opts.contact.phone, "div", "padded inline-block"));
			rights.push(contacts);
		}
		if (rights.length)
			content.push(CT.dom.node(rights, "div", "right p20"));
		if (opts.bottom)
			content.push(CT.dom.node(opts.bottom, "div", "small bline centered"));
		document.body.classList.add("footered");
		document.body.appendChild(CT.dom.node(content, "div", null, "ctfooter"));
	},
	grid: function(data, columns, rows, hardheight) {
		var className = "w1-" + (columns || 3) + " h1-" + (rows || 4)
			+ " noflow inline-block hoverglow pointer";
		return CT.dom.node(data.map(function(d) {
			var nstyle = {
				backgroundImage: "url(" + d.img + ")",
				backgroundPosition: "center",
				backgroundSize: "cover"
			};
			if (hardheight)
				nstyle.height = hardheight + "px";
			return CT.dom.node(CT.dom.node(d.label,
				"div", "biggest centered p20p overlay", null, null, {
					paddingTop: "20%"
				}), "div", className, null, {
					onclick: d.onclick || function() {
						location = d.link;
					}
				}, nstyle);
		}), "div", "full");
	},
	profile: function(opts) {
		opts = CT.merge(opts, {
			pan: true,
			panDuration: 5000,
			buttons: []
		});
		var img = CT.dom.node(CT.dom.img(opts.img, "abs"), "div", "w2-3 h1 noflow abs"),
			buttons = CT.dom.node(null, "div", "centered");
		if (opts.pan) {
			img.controller = CT.trans.pan(img.firstChild, {
				duration: opts.panDuration
			}, true);
			if (opts.controllerHook) {
				opts.controllerHook.hide = img.controller.pause;
				opts.controllerHook.show = img.controller.resume;
			}
		}
		for (var b in opts.buttons)
			buttons.appendChild(CT.dom.button(b, opts.buttons[b], "round padded margined"));
		if (!opts.name && opts.firstName && opts.lastName)
			opts.name = opts.firstName + " " + opts.lastName;
		return [
			CT.dom.node([
				CT.dom.node(opts.name, "div", "biggest"),
				CT.dom.node(opts.description || opts.blurb),
				buttons
			], "div", "right w1-3"),
			img
		];
	}
};