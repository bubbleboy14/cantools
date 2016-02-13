CT.modal = {};

CT.modal.Modal = CT.Class({
	"close": function() {
		CT.dom.remove(this.node);
	},
	"addClose": function() {
		this.node.appendChild(CT.dom.node(CT.dom.link("X", this.close), "div", "right"));
	},
	"build":  function() { // override
		this.addClose();
	},
	"init": function(opts) {
		this.opts = opts;
		this.node = CT.dom.node("", "div", "centeredpopup");
		this.build();
	}
});

CT.modal.Prompt = CT.Class({
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
		this.close();
	},
	"build": function() {
		this.input = this._input[this.opts.style || "string"](this.opts.data || []);
		this.node.appendChild(CT.dom.node(this.opts.prompt));
		this.node.appendChild(this.input);
		this.node.appendChild(CT.dom.button("Continue", this.submit));
		this.node.appendChild(CT.dom.button("Cancel", this.close));
	}
}, CT.modal.Modal);