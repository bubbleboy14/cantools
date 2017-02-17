/*
This module provides functions that generate common UI elements. These include:

### header(opts) - defaults:
	logo: "Placeholder Logo"
	right: []
	rightPadding: "30px" // non-centerLogo only!
	centerLogo: true
	img: null
	panDuration: null (falls back to CT.dom.panImg() default of 5000)

### footer(opts) - defaults:
	logo: "Placeholder Logo"
	links: []
	contact: {}
	img: null
	panDuration: null (falls back to CT.dom.panImg() default of 5000)

### grid(data, columns, rows, hardheight) - defaults:
	columns: 3
	rows: 4

### profile(opts) - defaults:
	className: "w2-3 h1 noflow abs"
	buttons: []

### listView(opts) - defaults:
	parent: "ctmain"
	listClass: "ctlist big"
	contentClass: "ctcontent"
	titleClass: "biggerest bold bottompadded"
	content: null
	listNode: null
	listContent: null
	activeClass: null
	fallback: null
	hashcheck: null

*/

CT.layout = {
	header: function(opts) {
		opts = CT.merge(opts, {
			logo: "Placeholder Logo",
			right: [],
			rightPadding: "30px", // non-centerLogo only!
			centerLogo: true
		});
		var content = [];
		if (opts.img) // opts also may include: panDuration
			content.push(CT.dom.panImg(opts));
		if (opts.right instanceof Node || opts.right.length) {
			if (opts.centerLogo)
				content.push(CT.dom.node(opts.right, "div", "right padded"));
			else
				content.push(CT.dom.node(CT.dom.node(opts.right, "div",
					"right h1", null, null, { padding: opts.rightPadding }),
					"div", "abs top0 bottom0 right0 w1-2"));
		}
		if (opts.centerLogo)
			content.push(CT.dom.node(CT.dom.link(opts.logo, null, "/"), "center", "biggerester"));
		else
			content.push(CT.dom.link(opts.logo, null, "/",
				"w1-2 biggest bold block nodecoration abs top0 bottom0 left0"));
		CT.dom.setContent(CT.dom.id("ctheader"), CT.dom.node(content, "div", "h1 w1"));
	},
	footer: function(opts) {
		opts = CT.merge(opts, {
			logoClass: "left nodecoration",
			linksClass: "right p20",
			bottomClass: "small bline centered",
			logo: "Placeholder Logo",
			links: [],
			contact: {}
		});
		var rights = [], content = [];
		if (opts.img) // opts also may include: panDuration
			content.push(CT.dom.panImg(opts));
		content.push(CT.dom.link(opts.logo, null, "/", opts.logoClass));
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
			content.push(CT.dom.node(rights, "div", opts.linksClass));
		if (opts.bottom)
			content.push(CT.dom.node(opts.bottom, "div", opts.bottomClass));
		if (opts.extra)
			content.push(opts.extra);
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
			className: "w2-3 h1 noflow abs",
			buttons: []
		});
		var img = CT.dom.panImg(opts),
			buttons = CT.dom.node(null, "div", "centered");
		for (var b in opts.buttons)
			buttons.appendChild(CT.dom.button(b, opts.buttons[b], "round padded margined"));
		if (!opts.name && opts.firstName && opts.lastName)
			opts.name = opts.firstName + " " + opts.lastName;
		return [
			CT.dom.node([
				CT.dom.node(opts.name, "div", "biggest"),
				CT.dom.node(opts.description || opts.blurb),
				buttons
			], "div", "right w1-3 ctprofile"),
			img
		];
	},
	listView: function(opts) {
		opts = CT.merge(opts, {
			content: null,
			listNode: null,
			listContent: null,
			activeClass: null,
			fallback: null,
			hashcheck: null,
			parent: "ctmain",
			listClass: "ctlist big",
			contentClass: "ctcontent",
			titleClass: "biggerest bold bottompadded"
		});
		var content = CT.dom.div(null, opts.contentClass),
			clist = CT.dom.div(null, opts.listClass),
			builder = function(data) {
				CT.dom.setContent(content, opts.content ? opts.content(data) : [
					CT.dom.div(data.name, opts.titleClass),
					data.content
				]);
			}, tl = CT.panel.triggerList(opts.data, builder, opts.listNode, opts.activeClass, opts.listContent);
		clist.appendChild(tl);
		CT.dom.setContent(opts.parent, [content, clist]);
		var hcnode, tlitem = CT.dom.id("tl" + location.hash.slice(1));
		if (tlitem)
			tlitem.trigger();
		else {
			if (opts.hashcheck)
				hcnode = opts.hashcheck();
			if (hcnode)
				CT.dom.setContent(content, hcnode);
			else {
				var titems = CT.dom.className("tlitem");
				if (titems.length)
					titems[0].trigger();
				else if (opts.fallback)
					CT.dom.setContent(content, opts.fallback());
			}
		}
		return tl;
	}
};