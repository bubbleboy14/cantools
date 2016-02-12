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
			"single-choice": function(data) { // node array
				return CT.dom.node("not implemented");
			},
			"multiple-choice": function(data) { // node array
				return CT.dom.node("not implemented");
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
			this.node = CT.dom.node([
				CT.dom.node(this.prompt), this.input,
				CT.dom.button("Continue", this._.submit),
				CT.dom.button("Cancel", this._.close)
			], "div", "centeredpopup");
		}
	},
	"init": function(cb, prompt, pstyle, data) {
		this.cb = cb;
		this.prompt = prompt;
		this.input = this._.input[pstyle](data);
		this._.buildFrame();
	}
});