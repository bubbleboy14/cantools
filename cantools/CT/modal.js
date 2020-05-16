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
		className: "backdrop",
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
		className: "basicpopup mosthigh",
		style: "string", // string|multiple-string|password|single-choice|multiple-choice|file|number|time|date|form|icon|phone|email|sound
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
		transition: "slide"
	},
	defaults: function(opts) {
		CT.modal._defs = opts;
	},
	prompt: function(opts) {
		(new CT.modal.Prompt(CT.merge(opts, {
			transition: "slide"
		}))).show();
	},
	choice: function(opts) {
		CT.modal.prompt(CT.merge(opts, {
			noClose: true,
			defaultIndex: 0,
			style: "single-choice"
		}));
	},
	modal: function(content, onhide, opts) {
		var mod = new CT.modal.Modal(CT.merge({
			content: content
		}, opts, CT.modal._defs));
		if (onhide) mod.on.hide = onhide;
		mod.show();
		return mod;
	},
	img: function(src, onhide) {
		return CT.modal.modal(CT.dom.img(src, "wm200p hm200p"), onhide);
	}
};

CT.modal._defaults = {
	Modal: {
		className: "basicpopup",
		innerClass: "h1 w1 scroller",
		transition: "none",
		center: true,
		noClose: false, // turns off 'x' in corner
		onclick: null,
		slide: { // only applies if transition is 'slide'
			origin: "top"
		}
	},
	LightBox: {
		className: "backdrop",
		innerClass: "lightbox",
		transition: "fade",
		caption: "",
		noClose: true,
		outerClose: true
	},
	Prompt: {
		className: "basicpopup mosthigh",
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
			var val = parent.clientHeight || CT.align.height();
			val -= this.node.clientHeight;
			return val / 2;
		},
		_centerh: function(parent) {
			var val = parent.clientWidth || CT.align.width();
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
						property: "opacity",
						value: 1
					});
				}, 100);
			};
			n.hide = function() {
				CT.trans.trans({
					node: n,
					property: "opacity",
					value: 0,
					cb: function() {
						CT.dom.remove(n);
					}
				});
			};
		},
		slide: function() {
			var n = this.node, add = this.setup._add,
				origin = this.opts.slide.origin,
				center = this.opts.center,
				centerv = this.setup._centerv,
				centerh = this.setup._centerh,
				fallbacks = this.setup._fallbacks,
				ver = false, hor = false;

			var _refresh = function(parent, force) {
				parent = (parent instanceof Node) ? parent : document.body;
				["top", "bottom"].forEach(function(side, sideIndex) {
					if (origin.startsWith(side)) {
						n.style[side] = -n.clientHeight + "px";
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
					if (origin.endsWith(side)) {
						n.style[side] = -n.clientWidth + "px";
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
	hide: function() {
		this.node.hide();
		this.visible = false;
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
		var opts = this.opts, nodeStyle = {};
		["top", "bottom", "right", "left"].forEach(function(side) {
			if (side in opts.slide)
				nodeStyle[side] = opts.slide[side];
		});
		this.node = CT.dom.div(CT.dom.div(null, opts.innerClass),
			opts.className, null, { onclick: opts.onclick }, nodeStyle);
		if (!opts.noClose)
			this.addClose();
		this.node.modal = this;
		this.setup[opts.transition]();
		this.build();
		if (opts.content || opts.node) // 'node' is now deprecated :'(
			this.add(opts.content || opts.node);
		this.opts.recenter && setTimeout(this.node.recenter, 500);
	},
	init: function(opts) {
		this.opts = CT.merge(opts, CT.modal._defaults.Modal);
		setTimeout(this._buildContent); // wait a tick for all inits to run
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
			if (this.opts.autocomplete)
				return CT.autocomplete.DBGuesser({
					rows: true,
					input: CT.dom.field(),
					tapCb: this.submitAC,
					property: this.opts.autocomplete.property,
					modelName: this.opts.autocomplete.modelName
				}).input;
			else {
				return CT.dom.smartField({
					cb: this.submit,
					isTA: this.opts.isTA,
					blurs: this.opts.blurs,
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
			var cz = CT.dom.choices(this._nodify(data), true),
				selz = this.opts.selections;
			selz && CT.dom.each(cz, function(sel) {
				if (selz.includes(sel.innerHTML))
					sel.onclick();
			});
			return cz;
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
			return CT.layout.form({ items: data });
		},
		"icon": function(data) {
			return CT.dom.iconSelector(data, true);
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
				|| ((typeof this.input.value == "function") && this.input.value())
				|| this.opts.data[this.input.value] || this.input.value));
		}
		this.hide();
	},
	_nodify: function(data) {
		return data.map(function(d) {
			if (typeof d == "string")
				return CT.dom.node(d);
			else if (!(d instanceof Node))
				return CT.dom.node(d.name || d.title || d.label);
			return d;
		});
	},
	build: function() {
		this.continueButton = CT.dom.button("Continue", this.submit);
		this.node.appendChild(CT.dom.node(this.opts.prompt));
		if (this.opts.style != "confirm") {
			this.input = this._input[this.opts.style](this.opts.data);
			this.node.appendChild(this.input);
		}
		this.node.appendChild(this.continueButton);
		this.node.appendChild(CT.dom.button("Cancel", this.hide));
	},
	init: function(opts) {
		this.opts = CT.merge(opts, CT.modal._defaults.Prompt, this.opts);
	}
}, CT.modal.Modal);