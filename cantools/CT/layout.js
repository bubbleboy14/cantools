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

### tree(opts) - defaults:
	path: ""
	nameCb: null // generates name node content, falls back to name
	branches: {}
	cb: function() {}
	name: opts.title || "root"
	className: "m5 p5 vtop centered pointer inline-block"

### form(opts) - defaults:
	className: "ctform"
	items: []
*/

CT.layout = {
	header: function(opts) {
		opts = CT.merge(opts, {
			logo: "Placeholder Logo",
			right: [],
			rightPadding: "30px", // non-centerLogo only!
			linksClass: "abs top0 bottom0 right0 w1-2",
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
					"div", opts.linksClass));
		}
		if (opts.centerLogo)
			content.push(CT.dom.node(CT.dom.link(opts.logo, null, "/"), "center", "biggerester"));
		else
			content.push(CT.dom.link(opts.logo, null, "/",
				"wm1-2 biggest bold block nodecoration abs top0 bottom0 left0"));
		if (opts.marquee) { // lol
			var m = opts.marquee;
			content.push(CT.dom.marquee(m.content,
				m.className || "abs ctl mosthigh", m.direction, m.noresize));
		}
		var bighead = CT.dom.id("ctheader");
		if (opts.hamburgize) {
			bighead.classList.add("hamburgize");
			var hambo = CT.dom.div(null, null, "hambo", {
				onclick: function() {
					hambo._slidin = !hambo._slidin;
					bighead.classList[hambo._slidin ? "add" : "remove"]("slidin");
				}
			});
			content.push(hambo);
			CT.dom.head(CT.dom.node(null, "meta", null, null, {
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no"
			}));
		}
		if (opts.banner && opts.banner[location.pathname]) {
			content.push(opts.banner[location.pathname]);
			document.body.classList.add("bannered");
		}
		CT.dom.setContent(bighead, CT.dom.div(content, "h1 w1"));
		if (opts.title)
			document.title = opts.title;
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
				return CT.dom.link(link.content, link.cb,
					link.href, link.className || "padded");
			}));
		if (opts.contact.email || opts.contact.phone) {
			var contacts = [];
			if (opts.contact.email_prefix)
				contacts.push(CT.dom.div(opts.contact.email_prefix, "padded inline-block"));
			if (opts.contact.email)
				contacts.push(CT.dom.div(opts.contact.email, "padded inline-block"));
			if (opts.contact.phone)
				contacts.push(CT.dom.div(opts.contact.phone, "padded inline-block"));
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
			+ " noflow inline-block hoverglow pointer", data2cell = function(d) {
				var nstyle = {
					backgroundImage: 'url("' + d.img + '")',
					backgroundPosition: "center",
					backgroundSize: "cover"
				};
				if (hardheight)
					nstyle.height = hardheight + "px";
				return CT.dom.div(CT.dom.div(d.label,
					"biggest centered p20p overlay", d.id, null, {
						paddingTop: "20%"
					}), className, null, {
						onclick: d.onclick || function() {
							location = d.link;
						}
					}, nstyle);
			}, gnode = CT.dom.div(data.map(data2cell), "full");
		gnode.addCell = function(d) {
			gnode.appendChild(data2cell(d));
		};
		return gnode;
	},
	profile: function(opts) {
		opts = CT.merge(opts, {
			className: "w2-3 h1 noflow abs",
			buttons: []
		});
		var img = CT.dom.panImg(opts),
			buttons = CT.dom.div(null, "probutts");
		if (!opts.name && opts.firstName && opts.lastName)
			opts.name = opts.firstName + " " + opts.lastName;
		for (var b in opts.buttons)
			buttons.appendChild(CT.dom.button(b,
				opts.buttons[b], "round padded margined",
				"ctb_" + (opts.key || opts.name) + "_" + b.replace(/ /g, "_")));
		var content = [
			CT.dom.div(opts.name, "biggest"),
			CT.dom.div(opts.description || opts.blurb),
			buttons
		];
		return opts.img ? [
			CT.dom.div(content, "right w1-3 ctprofile"),
			img
		] : content;
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
	},
	tree: function(opts) {
		opts = CT.merge(opts, {
			path: "",
			nameCb: null,
			branches: {},
			cb: function() {},
			name: opts.title || "root",
			className: "m5 p5 vtop centered pointer inline-block"
		});
		var onclick = function(n) {
			return function(e) {
				opts.cb(n);
				e.stopPropagation();
			};
		};
		opts.path = !opts.path ? opts.name : (opts.path + "_" + opts.name);
		opts.id = "ctl_" + opts.path;
		var node = CT.dom.div([
			opts.nameCb ? opts.nameCb(opts) : opts.name,
			Object.keys(opts.branches).map(function(branch) {
				return CT.layout.tree(CT.merge({
						name: branch,
						branches: opts.branches[branch].branches || {}
					}, opts));
			})
		], opts.className, opts.id);
		node.onclick = onclick(node);
		return node;
	},
	form: function(opts) {
		opts = CT.merge(opts, {
			className: "ctform",
			items: [],
			numbers: []
		});
		var f, val, fields = [], nums = [], node = CT.dom.div(opts.items.map(function(item) {
			if (opts.values && opts.values[item.name] && !item.value)
				item = CT.merge(item, { value: opts.values[item.name] });
			if (item.style == "fieldList") {
				item.wrap = true;
				item.vals = item.vals || item.value;
			}
			f = CT.dom[item.style || "smartField"](item);
			item.style && f.classList.add(item.style);
			f.getVal = f.fieldValue || f.value;
			f.opts = item;
			fields.push(f);
			if (opts.labels) {
				var lab = CT.dom.label(item.label || item.name, f.id),
					cont = CT.dom.div([lab, f]);
				if (opts.extra && opts.extra[item.name])
					cont.unshift(opts.extra[item.name](f));
				cont.opts = f.opts;
				cont.getVal = f.getVal;
				cont.updateField = f.update;
				cont.setLabel = function(lval) {
					CT.dom.setContent(lab, lval);
				};
				cont.upLabel = function() {
					item.labeller && cont.setLabel(item.labeller(vals));
				};
				cont.update = function() {
					cont.upLabel();
					cont.updateField && cont.updateField(vals);
				};
				return cont;
			}
			return f;
		}).concat(opts.numbers.map(function(nitem) { // depped .. embed among items[] instead
			f = CT.dom.numberSelector(nitem);
			nums.push(f);
			return [ CT.dom.div(nitem.name, "right"), f ];
		})), opts.className), i, name, backButt, vals = node.vals = {}, nahs = [undefined, ""];
		node.setVal = function(f) {
			val = f.getVal();
			name = f.opts.name;
			if (nahs.includes(val))
				return alert("please provide a " + CT.parse.key2title(name));
			vals[name] = val;
			return val;
		};
		node.value = function() {
			for (i = 0; i < fields.length; i++)
				if (nahs.includes(node.setVal(fields[i])))
					return;
			for (i = 0; i < nums.length; i++)
				vals[opts.numbers[i].name] = nums[i].value();
			opts.cb && opts.cb(vals);
			return vals;
		};
		if (opts.step) {
			node.classList.add("stepper");
			node.nextStep = function(submitter, recenterer) {
				if (node.curStep) {
					if (nahs.includes(node.setVal(node.curStep))) return;
					opts.onStep && opts.onStep(vals);
					node.curStep.classList.remove("curstep");
					node.curStep = node.curStep.nextSibling;
					if (node.curStep.type == "submit")
						node.curStep = null;
					while (node.curStep && node.curStep.opts.condition && !vals[node.curStep.opts.condition])
						node.curStep = node.curStep.nextSibling;
				} else
					node.curStep = node.firstChild;
				if (node.curStep) {
					if (backButt)
						backButt.disabled = !CT.dom.childNum(node.curStep);
					node.curStep.update && node.curStep.update();
					node.curStep.classList.add("curstep");
					recenterer && setTimeout(recenterer, 500);
				} else
					submitter();
			};
			node.prevStep = function() {
				node.curStep.classList.remove("curstep");
				node.curStep = node.curStep.previousSibling.previousSibling;
				node.nextStep();
			};
			backButt = opts.backButton && CT.dom.button(opts.bbname || "back", node.prevStep, opts.backButtClass);
			backButt && node.appendChild(backButt);
			node.nextStep();
		}
		node.continue = function() {
			if (opts.step && node.curStep) {
				node.nextStep(node.value);
				if (!node.hasStepped) {
					node.hasStepped = true;
					opts.onStarted && opts.onStarted(node);
				}
			}
			else
				node.value();
		};
		if (opts.button) {
			node.butt = CT.dom.button(opts.bname || "continue", node.continue, opts.buttClass);
			node.appendChild(node.butt);
		}
		return node;
	}
};