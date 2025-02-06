/*
This module contains three classes, Modal, LightBox, and Prompt.

### CT.modal.Modal
Creates a DOM node that can be transitioned
on- and off- screen to/from a configurable position.

defaults:
	{
		className: "basicpopup",
		innerClass: "h1 w1 scroller",
		transition: "none", // none|fade|slide
		center: true,
		noClose: false, // turns off 'x' in corner
		onclick: null,
		slide: { // only applies if transition is 'slide'
			origin: "top"
		}
	}

Note that the optional 'slide' object -- which only applies when
transition is 'slide' -- may include 'top', 'left', 'bottom', and 'right'
properties. For any other transition (when center is false), please
position your node via css class (specified via 'className' property).

### CT.modal.LightBox (Modal subclass)
Centered, almost-fullscreen, fade-in, image-backed modal with translucent backdrop.

defaults:
	{
		className: "backdrop mosthigh",
		innerClass: "lightbox",
		transition: "fade",
		caption: "",
		noClose: true,
		outerClose: true
	}

### CT.modal.Prompt (Modal subclass)
Includes interface elements for obtaining user input, such as
a string, a password, or one or more selections from a list.

defaults:
	{
		className: "basicpopup mosthigh flex col",
		style: "string", // string|multiple-string|password|single-choice|multiple-choice|file|number|time|date|form|icon|phone|email|sound|reorder|draggers
		prompt: "",
		clear: false, // string/password only
		data: [] // only applies to choice styles
	}

Additionally, CT.modal includes several convenience functions:

### Four options:
    - prompt: prompt the user for a string
    - choice: offer several options
    - modal: basic popup
    - img: slide in an image
*/

CT.modal = {
	_defs: {
		resizeRecenter: true,
		orienter: "window" // || node
	},
	defaults: function(opts) {
		CT.modal._defs = CT.merge(opts, CT.modal._defs);
	},
	prompt: function(opts) {
		var oz = CT.merge(opts, CT.modal._defs);
		if (oz.recycle)
			oz.id = oz.id || oz.prompt;
		(new CT.modal.Prompt(oz)).show();
	},
	choice: function(opts) {
		CT.modal.prompt(CT.merge(opts, {
			noClose: true,
			defaultIndex: 0,
			style: "single-choice"
		}));
	},
	modal: function(content, onhide, opts, closeOnClick, noshow, variety) {
		var coz = { content: content }, mod;
		if (closeOnClick)
			coz.onclick = () => mod.hide();
		mod = new CT.modal[variety || "Modal"](CT.merge(opts, coz, CT.modal._defs));
		if (onhide) mod.on.hide = onhide;
		noshow || mod.show();
		return mod;
	},
	lightbox: function(content, onhide, opts, closeOnClick, noshow) {
		return CT.modal.modal(content, onhide, opts, closeOnClick, noshow, "LightBox");
	},
	iframe: function(src, onhide) {
		return CT.modal.lightbox(CT.dom.iframe(src, "full"), onhide);
	},
	img: function(src, onhide, className) {
		return CT.modal.modal(CT.dom.img(src, className || "wm200p hm200p"), onhide);
	},
	close: function() {
		var latest = CT.modal.latest;
		if (latest) {
			delete CT.modal.latest;
			if (latest.continueButton)
				latest.continueButton.onclick();
			else
				latest.hide();
		}
	}
};

CT.modal._defaults = {
	Modal: {
		className: "basicpopup",
		innerClass: "h1 w1 scroller",
		transition: "slide",
		center: true,
		noClose: false, // turns off 'x' in corner
		onclick: null,
		slide: { // only applies if transition is 'slide'
			origin: "top"
		}
	},
	LightBox: {
		className: "backdrop mosthigh",
		innerClass: "lightbox",
		transition: "fade",
		caption: "",
		noClose: true,
		outerClose: true
	},
	Prompt: {
		className: "basicpopup mosthigh flex col",
		transition: "slide",
		style: "string",
		prompt: "",
		clear: false, // string/password only
		data: []
	}
};

CT.modal.Modal = CT.Class({
	CLASSNAME: "CT.modal.Modal",
	visible: false,
	setup: {
		_centerv: function(parent) {
			var val = (this.opts.orienter == "window") ? window.innerHeight : (parent.clientHeight || CT.align.height());
			val -= this.node.clientHeight;
			return val / 2;
		},
		_centerh: function(parent) {
			var val = (this.opts.orienter == "window") ? window.innerWidth : (parent.clientWidth || CT.align.width());
			val -= this.node.clientWidth;
			return val / 2;
		},
		_fallbacks: function(parent, force) {
			var n = this.node;
			if (force || (!n.style.top && !n.style.bottom))
				n.style.top = this.setup._centerv(parent) + "px";
			if (force || (!n.style.left && !n.style.right))
				n.style.left = this.setup._centerh(parent) + "px";
		},
		_add: function(parent, nocenter) {
			var n = this.node;
			parent = (parent instanceof Node) ? parent : document.body;
			if (n.backdrop)
				CT.dom.addContent(parent, n.backdrop);
			CT.dom.addContent(parent, n);
			this.opts.center && !nocenter && this.setup._fallbacks(parent);
		},
		none: function() {
			var n = this.node;
			n.show = this.setup._add;
			n.hide = function() {
				CT.dom.remove(n);
			};
		},
		fade: function() {
			var n = this.node, add = this.setup._add;
			n.show = function(parent) {
				n.style.opacity = 0;
				add(parent);
				setTimeout(function() {
					CT.trans.trans({
						node: n,
						value: 1,
						duration: 1000,
						property: "opacity"
					});
				}, 100);
			};
			n.hide = function() {
				CT.trans.trans({
					node: n,
					value: 0,
					duration: 1000,
					property: "opacity",
					cb: function() {
						CT.dom.remove(n);
					}
				});
			};
		},
		slide: function() {
			var n = this.node, add = this.setup._add, oz = this.opts,
				origin = oz.slide.origin,
				center = oz.center,
				windOrienter = oz.orienter == "window",
				centerv = this.setup._centerv,
				centerh = this.setup._centerh,
				fallbacks = this.setup._fallbacks,
				ver = false, hor = false;

			var _refresh = function(parent, force) {
				parent = (parent instanceof Node) ? parent : document.body;
				["top", "bottom"].forEach(function(side, sideIndex) {
					var h = windOrienter ? window.innerHeight : n.clientHeight;
					if (origin.startsWith(side)) {
						n.style[side] = -h + "px";
						n._vout = {
							node: n,
							property: side,
							value: n.style[side]
						};
						n._vin = {
							node: n,
							property: side,
							value: (center ? centerv(parent) : 0) + "px"
						};
						ver = true;
					}
				});
				["left", "right"].forEach(function(side, sideIndex) {
					var w = windOrienter ? window.innerWidth : n.clientWidth;
					if (origin.endsWith(side)) {
						n.style[side] = -w + "px";
						n._hout = {
							node: n,
							property: side,
							value: n.style[side]
						};
						n._hin = {
							node: n,
							property: side,
							value: (center ? centerh(parent) : 0) + "px"
						};
						hor = true;
					}
				});
				fallbacks(parent, force);
			};

			n.show = function(parent) {
				add(parent, true);
				n.recenter(parent, true);
			};
			n.hide = function() {
				ver && CT.trans.trans(n._vout);
				hor && CT.trans.trans(n._hout);
				CT.trans.trans({ cb: function() {
					CT.dom.remove(n);
				}});
			};
			n.recenter = function(parent, noforce) {
				_refresh(parent, !noforce);
				setTimeout(function() {
					ver && CT.trans.trans(n._vin);
					hor && CT.trans.trans(n._hin);
				}, 100);
			};
		}
	},
	on: {
		show: function() {},
		hide: function() {}
	},
	removables: [],
	registerRemovable: function(node) {
		this.removables.push(node);
	},
	hide: function() {
		this.node.hide();
		if (this.node.backdrop)
			CT.dom.remove(this.node.backdrop);
		this.visible = false;
		this.removables.forEach(r => r.remove());
		this.on.hide();
	},
	_show: function(n) {
		this.node.show(n);
		this.visible = true;
		this.on.show();
	},
	show: function(n, cb) {
		if (typeof n == "string")
			n = CT.dom.id(n);
		setTimeout(this._show, 0, n); // wait a tick for initialization
		cb && setTimeout(cb, 200);
	},
	showHide: function(n) {
		this.visible ? this.hide() : this.show(n);
	},
	addClose: function() {
		this.node.insertBefore(CT.dom.div(CT.dom.link("X", this.hide),
			"abs ctr above"), this.node.firstChild);
	},
	build: function() {}, // override w/ add() calls
	clear: function() {
		this.node.lastChild.innerHTML = "";
	},
	isClear: function() {
		return !this.node.lastChild.childElementCount;
	},
	add: function(content) {
		CT.dom.addContent(this.node.lastChild, content);
	},
	set: function(node) {
		this.clear();
		this.add(node);
	},
	_buildContent: function() {
		var opts = this.opts, nodeStyle = {}, sub = CT.dom.div(null, opts.innerClass);
		["top", "bottom", "right", "left"].forEach(function(side) {
			if (side in opts.slide)
				nodeStyle[side] = opts.slide[side];
		});
		this.node = opts.id && CT.dom.id(opts.id) || CT.dom.div(null,
			opts.className, opts.id, { onclick: opts.onclick }, nodeStyle);
		CT.dom.setContent(this.node, sub);
		if (!opts.noClose)
			this.addClose();
		this.node.modal = this;
		if (this.opts.backdrop) {
			this.node.backdrop = CT.dom.div(null, "backdrop");
			if (this.opts.outerClose)
				this.node.backdrop.onclick = () => this.hide();
		}
		this.setup[opts.transition]();
		this.build();
		if (opts.content || opts.node) // 'node' is now deprecated :'(
			this.add(opts.content || opts.node);
		this.opts.recenter && setTimeout(this.node.recenter, 500);
		this.opts.resizeRecenter && window.addEventListener("resize", this.node.recenter);
	},
	init: function(opts) {
		this.opts = CT.merge(opts, CT.modal._defaults.Modal);
		setTimeout(this._buildContent); // wait a tick for all inits to run
		if (!opts.notlatest)
			CT.modal.latest = this;
	}
});

CT.modal.LightBox = CT.Class({
	init: function(opts) {
		var thiz = this;
		this.opts = opts = CT.merge(opts, {
			onclick: function(e) {
				if (opts.outerClose && (e.currentTarget == e.target)) thiz.hide();
			},
			content: CT.dom.div(CT.dom.div(this.opts.caption,
				"biggest bold padded round translucent full-center white grayback pointer hoverglow"),
				"backdrop-img filler", "", null, {
					backgroundImage: "url(" + this.opts.img + ")"
				})
		}, CT.modal._defaults.LightBox, CT.modal._defaults.Modal);
	}
}, CT.modal.Modal);

CT.modal.Prompt = CT.Class({
	CLASSNAME: "CT.modal.Prompt",
	_input: {
		string: function() {
			if (this.opts.autocomplete) {
				var dbg = new CT.autocomplete.DBGuesser({
					rows: true,
					input: CT.dom.field(),
					tapCb: this.submitAC,
					filters: this.opts.autocomplete.filters,
					property: this.opts.autocomplete.property,
					modelName: this.opts.autocomplete.modelName
				});
				this.registerRemovable(dbg.node);
				return dbg.input;
			} else {
				return CT.dom.smartField({
					cb: this.submit,
					isTA: this.opts.isTA,
					blurs: this.opts.blurs,
					value: this.opts.value,
					classname: this.opts.inputClass
				});
			}
		},
		"multiple-string": function() {
			var fl = CT.dom.fieldList();
			this.node.appendChild(fl.empty);
			this.node.appendChild(fl.addButton);
			return fl;
		},
		password: function() {
			return CT.dom.smartField(this.submit,
				null, null, null, "password");
		},
		phone: function() {
			return CT.parse.numOnly(CT.dom.smartField(this.submit), false, true);
		},
		email: function() {
			return CT.dom.smartField(this.submit);
		},
		"single-choice": function(data) {
			var cz = CT.dom.choices(this._nodify(data));
			if ("defaultIndex" in this.opts)
				cz.childNodes[this.opts.defaultIndex].onclick();
			return cz;
		},
		"multiple-choice": function(data) {
			var selz = this.opts.selections, lnkz = this.opts.linkages,
				cz = CT.dom.choices(this._nodify(data), true, null, null, lnkz && function(i) {
					var val = data[i], trig;
					if (cz.value.includes(i) && (val in lnkz)) {
						for (trig of lnkz[val]) {
							ti = data.indexOf(trig);
							cz.value.includes(ti) || cz.childNodes[ti].onclick();
						}
					}
				}, null, this.opts.filter, this.prompter);
			selz && CT.dom.each(cz, function(sel) {
				if (selz.includes(sel.innerHTML))
					sel.onclick();
			});
			return cz;
		},
		"reorder": function(data) {
			return CT.dom.shuffler(data, this.opts.rower);
		},
		"draggers": function(data) {
			var oz = this.opts;
			return CT.dom.dragListList(data, oz.rower, oz.colattrs, oz.colstyle, oz.dataer);
		},
		"file": function() {
			this.continueButton.disabled = true;
			return CT.file.getter(function(ctf) {
				if (ctf.opts.path)
					this.continueButton.disabled = false;
			}.bind(this));
		},
		"number": function() {
			return CT.dom.numberSelector(this.opts);
		},
		"time": function() {
			return CT.dom.timeSelector();
		},
		"date": function(data) {
			var oz = { update: true };
			if (data) oz.now = data;
			return (new CT.cal.Cal(oz)).node;
		},
		"form": function(data) {
			return CT.layout.form({
				items: data || [],
				step: this.opts.step,
				labels: this.opts.labels,
				numbers: this.opts.numbers || []
			});
		},
		"icon": function(data) {
			var oz = this.opts;
			return CT.dom.iconSelector(data, true,
				oz.page, oz.iclick, oz.searchable);
		},
		"sound": function(data) {
			return CT.dom.soundSelector(data, true);
		}
	},
	on: {
		show: function() {
			this.input && !this.opts.blurs && this.input.focus();
			if (this.opts.clear)
				this.input.value = "";
		},
		hide: function() {}
	},
	submitAC: function(d) {
		this.opts.cb(d);
		this.hide();
	},
	submit: function() {
		if (this.opts.style == "form" && this.opts.step && this.input.curStep)
			return this.input.nextStep(this.submit, this.node.recenter);
		if (this.opts.style == "multiple-choice") {
			var that = this;
			this.opts.cb(this.input.value.map(function(val) {
				return that.opts.data[val];
			}));
		} else {
			if (this.opts.style == "phone" && this.input.value.length != 10)
				return alert("please use a 10-digit phone number");
			else if (this.opts.style == "email" && !CT.parse.validEmail(this.input.value))
				return alert("please enter a valid email address");
			this.opts.cb(this.input && (this.input.ctfile
				|| ((typeof this.input.value == "function") ? this.input.value()
					: (this.opts.data[this.input.value] || this.input.value))));
		}
		this.hide();
	},
	_nodify: function(data) {
		return data.map(function(d) {
			if (["string", "number"].includes(typeof d))
				return CT.dom.node(d);
			else if (!(d instanceof Node))
				return CT.dom.node(d.name || d.title || d.label);
			return d;
		});
	},
	build: function() {
		this.continueButton = CT.dom.button("Continue", this.submit);
		this.prompter = CT.dom.node(this.opts.prompt);
		this.node.insertBefore(this.prompter, this.node.lastChild);
		if (this.opts.style != "confirm") {
			this.input = this._input[this.opts.style](this.opts.data);
			this.add(this.input);
		}
		this.node.appendChild(this.continueButton);
		this.opts.noCancel || this.node.appendChild(CT.dom.button("Cancel",
			this.hide, this.opts.cancelButtonClass));
	},
	init: function(opts) {
		this.opts = CT.merge(opts, CT.modal._defaults.Prompt, this.opts);
	}
}, CT.modal.Modal);