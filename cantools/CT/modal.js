CT.modal = {};

CT.modal.Modal = CT.Class({
	"CLASSNAME": "CT.modal.Modal",
	"visible": false,
	"hide": function() {
		CT.dom.remove(this.node);
		this.visible = false;
	},
	"show": function(n) {
		(n || document.body).appendChild(this.node);
		this.visible = true;
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
		this.opts = opts;
		this.node = CT.dom.node("", "div", "centeredpopup");
		this.build();
		if (opts.node)
			this.add(opts.node);
	}
});

CT.modal.Prompt = CT.Class({
	"CLASSNAME": "CT.modal.Prompt",
	"_input": {
		"string": function() {
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