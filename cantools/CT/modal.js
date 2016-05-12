/*
This module contains two classes, Modal and Prompt.

### CT.modal.Modal
Creates a DOM node that can be transitioned
on- and off- screen to/from a configurable position.

### CT.modal.Prompt (Modal subclass)
Includes interface elements for obtaining user input, such as
a string, a password, or one or more selections from a list.
*/

CT.modal.Modal = CT.Class({
	"CLASSNAME": "CT.modal.Modal",
	"visible": false,
	"setup": {
		"_centerv": function(parent) {
			return ((parent.clientHeight || CT.align.height()) - this.node.clientHeight) / 2;
		},
		"_centerh": function(parent) {
			return ((parent.clientWidth || CT.align.width()) - this.node.clientWidth) / 2;
		},
		"_fallbacks": function(parent) {
			var n = this.node;
			if (!n.style.top)
				n.style.top = this.setup._centerv(parent) + "px";
			if (!n.style.left)
				n.style.left = this.setup._centerh(parent) + "px";
		},
		"_add": function(parent) {
			var n = this.node;
			parent = (parent instanceof Node) ? parent : document.body;
			CT.dom.addContent(parent, n);
			this.opts.center && this.setup._fallbacks(parent);
		},
		"none": function() {
			var n = this.node;
			n.show = this.setup._add;
			n.hide = function() {
				CT.dom.remove(n);
			};
		},
		"fade": function() {
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
		"slide": function() {
			var n = this.node, add = this.setup._add,
				origin = this.opts.slide.origin,
				center = this.opts.center,
				centerv = this.setup._centerv,
				centerh = this.setup._centerh,
				fallbacks = this.setup._fallbacks,
				ver = true, hor = true;

			var _refresh = function(parent) {
				parent = (parent instanceof Node) ? parent : document.body;
				if (origin.startsWith("top")) {
					n.top_out = n.style.top = -n.clientHeight + "px";
					n.top_in = (center ? centerv(parent) : 0) + "px";
				}
				else if (origin.startsWith("bottom")) {
					n.top_out = n.style.top = parent.clientHeight + "px";
					n.top_in = (center ? centerv(parent) : (parent.clientHeight - n.clientHeight)) + "px";
				}
				else
					ver = false;
				if (origin.endsWith("left")) {
					n.left_out = n.style.left = -n.clientWidth + "px";
					n.left_in = (center ? centerh(parent) : 0) + "px";
				}
				else if (origin.endsWith("right")) {
					n.left_out = n.style.left = parent.clientWidth + "px";
					n.left_in = (center ? centerh(parent) : (parent.clientWidth - n.clientWidth)) + "px";
				}
				else
					hor = false;
				fallbacks(parent);
			};

			n.show = function(parent) {
				add(parent);
				_refresh(parent);
				setTimeout(function() {
					ver && CT.trans.trans({ node: n, property: "top", value: n.top_in });
					hor && CT.trans.trans({ node: n, property: "left", value: n.left_in });
				}, 100);
			};
			n.hide = function() {
				ver && CT.trans.trans({ node: n, property: "top", value: n.top_out });
				hor && CT.trans.trans({ node: n, property: "left", value: n.left_out });
				CT.trans.trans({ cb: function() {
					CT.dom.remove(n);
				}});
			};
		}
	},
	"on": {
		"show": function() {},
		"hide": function() {}
	},
	"hide": function() {
		this.node.hide();
		this.visible = false;
		this.on.hide();
	},
	"show": function(n) {
		this.node.show(n);
		this.visible = true;
		this.on.show();
	},
	"showHide": function() {
		this.visible ? this.hide() : this.show();
	},
	"addClose": function() {
		this.add(CT.dom.node(CT.dom.link("X", this.hide), "div", "right pointer"));
	},
	"build": function() { // override
		if (!this.opts.noClose)
			this.addClose();
	},
	"clear": function() {
		this.node.innerHTML = "";
	},
	"add": function(content) {
		CT.dom.addContent(this.node, content);
	},
	"set": function(node, addClose) {
		this.clear();
		addClose && this.addClose();
		this.add(node);
	},
	"init": function(opts) {
		this.opts = opts = CT.merge(opts, {
			"className": "basicpopup",
			"transition": "none",
			"center": true,
			"noClose": false, // turns off 'x' in corner
			"slide": { // only applies if transition is 'slide'
				"origin": "top"
			}
		});
		var nodeStyle = {};
		["top", "bottom", "right", "left"].forEach(function(side) {
			if (side in opts.slide)
				nodeStyle[side] = opts.slide[side];
		});
		this.node = CT.dom.node("", "div", opts.className, null, null, nodeStyle);
		this.node.modal = this;
		this.setup[opts.transition]();
		this.build();
		if (opts.content || opts.node) // 'node' is now deprecated :'(
			this.add(opts.content || opts.node);
	}
});

CT.modal.Prompt = CT.Class({
	"CLASSNAME": "CT.modal.Prompt",
	"_input": {
		"string": function() {
			if (this.opts.autocomplete)
				return CT.autocomplete.DBGuesser({
					input: CT.dom.field(),
					tapCb: this.submitAC,
					property: this.opts.autocomplete.property,
					modelName: this.opts.autocomplete.modelName
				}).input;
			else
				return CT.dom.smartField(this.submit);
		},
		"password": function() {
			return CT.dom.smartField(this.submit,
				null, null, null, "password");
		},
		"single-choice": function(data) {
			return CT.dom.choices(data);
		},
		"multiple-choice": function(data) {
			return CT.dom.choices(data, true);
		}
	},
	"on": {
		"show": function() {
			this.input.focus();
		},
		"hide": function() {}
	},
	"submitAC": function(d) {
		this.opts.cb(d);
		this.hide();
	},
	"submit": function() {
		this.opts.cb(this.input.value);
		this.hide();
	},
	"build": function() {
		this.input = this._input[this.opts.style || "string"](this.opts.data || []);
		this.node.appendChild(CT.dom.node(this.opts.prompt));
		this.node.appendChild(this.input);
		this.node.appendChild(CT.dom.button("Continue", this.submit));
		this.node.appendChild(CT.dom.button("Cancel", this.hide));
	}
}, CT.modal.Modal);