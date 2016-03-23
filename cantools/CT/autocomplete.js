CT.autocomplete.Guesser = CT.Class({
	CLASSNAME: "CT.autocomplete.Guesser",
	_doNothing: function() {},
	_returnTrue: function() { return true; },
	expand: function(cb) {
		this.viewing = true;
		this.node.className = "autocomplete autocomplete-open";
		cb && CT.trans.trans({ node: this.node, cb: cb });
	},
	retract: function() {
		if (!this.viewing)
			return;
		this.viewing = false;
		this.input.blur();
		var acnode = this.node;
		acnode.className = "autocomplete";
		CT.trans.trans({
			node: acnode,
			cb: function() {
				acnode.className = "autocomplete hider";
			}
		});
	},
	tapTag: function(tagName) {
		this.tapper(tagName);
	    this.retract();
	},
	addTag: function(tagName) {
		var n = CT.dom.node(tagName, "div", "tagline", "ac" + tagName);
		var tlower = tagName.toLowerCase();
		for (var i = 1; i <= tlower.length; i++)
			n.className += " " + tlower.slice(0, i);
		this.node.firstChild.appendChild(n);
		n.onclick = function() {
			this.tapTag(tagName);
		}.bind(this);
	},
	_upOne: function(d) {
		if (!CT.dom.id("ac" + d.label))
			this.addTag(d.label);
	},
	_update: function(data) {
		data.forEach(this._upOne);
	},
	_onUp: function(e) {
		if (!this.viewing) {
			this.opts.expandCb();
			CT.dom.mod({
				className: "tagline",
				show: true
			});
			this.expand(function() {
				this.input.active = true;
				this.input.focus();
			}.bind(this));
			return true;
		}
	},
	_onKeyUp: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which;
		if (code == 13 || code == 3) {
			this.input.blur();
			this.opts.enterCb();
		} else if (this.input.value) {
			var tagfrag = this.input.value.toLowerCase(),
				targets = CT.dom.className(tagfrag, this.node);
			CT.dom.mod({
				className: "tagline",
				hide: true
			});
			if (targets.length)
				CT.dom.mod({
					className: tagfrag,
					show: true
				});
			else
				this.guesser(tagfrag, this._update);
		} else CT.dom.mod({
			className: "tagline",
			hide: true
		});
		this.opts.keyUpCb();
	},
	init: function(opts) {
		opts = this.opts = CT.merge(opts, {
			enterCb: this._doNothing,
			keyUpCb: this._doNothing,
			expandCb: this._doNothing,
			tabCb: this._doNothing,
			guessCb: this._doNothing
		});
		CT.autocomplete.Guesser.id += 1;
		this.id = CT.autocomplete.Guesser.id;
		this.input = opts.input;
		this.tapper = opts.tapCb;
		this.guesser = this.guesser || opts.guessCb;
		var ipos = CT.align.offset(this.input);
		this.node = CT.dom.node(CT.dom.node(), null, "autocomplete hider", null, null, {
			position: "absolute",
			width: (this.input.clientWidth + 2) + "px",
			top: (ipos.top + 22) + "px",
			left: (ipos.left + 2) + "px"
		});
		document.body.appendChild(this.node);
		CT.drag.makeDraggable(this.node, { constraint: "horizontal" });
		CT.gesture.listen("down", this.input, this._returnTrue);
		CT.gesture.listen("up", this.input, this._onUp);
		this.input.onkeyup = this._onKeyUp;
	}
});
CT.autocomplete.Guesser.id = 0;

CT.autocomplete.DBGuesser = CT.Class({
	CLASSNAME: "CT.autocomplete.DBGuesser",
	guesser: function(frag) {
		CT.log("guessing: " + frag);
		var filters = {};
		filters[this.opts.property] = {
			comparator: "like",
			value: frag + "%"
		};
		CT.db.get(this.opts.modelName, this._update, null, null, null, filters);
	}
}, CT.autocomplete.Guesser);