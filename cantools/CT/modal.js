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
		"_add": function(parent) {
			if (parent instanceof Node)
				parent.appendChild(this.node);
			else
				document.body.appendChild(this.node);
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
				center = this.opts.slide.center,
				ver = true, hor = true;

			if (origin.startsWith("top")) {
				n.top_out = n.style.top = -n.clientHeight + "px";
				n.top_in = center ? "50%" : "0px";
			}
			else if (origin.startsWith("bottom")) {
				n.top_out = n.style.top = parent.clientHeight + "px";
				n.top_in = center ? "50%" : ((parent.clientHeight - n.clientHeight) + "px");
			}
			else
				ver = false;
			if (origin.endsWith("left")) {
				n.left_out = n.style.left = -n.clientWidth + "px";
				n.left_in = center ? "50%" : "0px";
			}
			else if (origin.endsWith("right")) {
				n.left_out = n.style.left = parent.clientWidth + "px";
				n.left_in = center ? "50%" : ((parent.clientWidth - n.clientWidth) + "px");
			}
			else
				hor = false;

			n.show = function(parent) {
				add(parent);
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
		this.addClose();
	},
	"clear": function() {
		this.node.innerHTML = "";
	},
	"add": function(node) {
		this.node.appendChild(node);
	},
	"set": function(node, addClose) {
		this.clear();
		addClose && this.addClose();
		this.add(node);
	},
	"init": function(opts) {
		this.opts = opts = CT.merge(opts, {
			"nodeClass": "basicmodal",
			"transition": "none",
			"slide": { // only applies if transition is 'slide'
				"origin": "top",
				"center": true
			}
		});
		this.node = CT.dom.node("", "div", opts.nodeClass);
		this.node.modal = this;
		this.setup[opts.transition]();
		this.build();
		if (opts.node)
			this.add(opts.node);
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