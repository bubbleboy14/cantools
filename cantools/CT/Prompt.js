CT.Prompt = CT.Class({
	"_": {
		"input": {
			"string": function() {
				return CT.dom.smartField(this._submit);
			},
			"password": function() {
				return CT.dom.smartField(this._submit,
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
			this.cb(this.input.value);
			this._.close();
		},
		"close": function() {
			CT.dom.remove(this.node);
		},
		"buildFrame": function() {
			this.input = this._.input[this.style](this.data);
			this.node = CT.dom.node([
				CT.dom.node(this.prompt), this.input,
				CT.dom.button("Continue", this._.submit),
				CT.dom.button("Cancel", this._.close)
			], "div", "centeredpopup");
		}
	},
	"init": function(cb, prompt, style, data) {
		this.cb = cb;
		this.prompt = prompt;
		this.style = style || "string";
		this.data = data || [];
		this._.buildFrame();
	}
});