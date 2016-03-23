CT.autocomplete = {};

CT.autocomplete.Guesser = CT.Class({
	data: {},
	_doNothing: function() {},
	_returnTrue: function() { return true; },
	_handleGuess: function(response_data) {
		this.data = CT.merge(response_data, this.data);
		this._update();
	},
	guess: function() {
		this.guesser(this._handleGuess);
	},
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
	tapTag: function(tagName, insertCurrent) {
		this.tapper(tagName, insertCurrent);
	    this.retract();
	},
	addTag: function(tagName) {
		var n = CT.dom.node(tagName, "div", "tagline");
		var tlower = tagName.toLowerCase();
		for (var i = 1; i <= tlower.length; i++)
			n.className += " " + tlower.slice(0, i);
		this.node.firstChild.appendChild(n);
		n.onclick = function() {
			this.tapTag(tagName);
		}.bind(this);
	},
	_update: function() {
		for (var k in this.data)
			this.addTag(this.data[k]);
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
			CT.dom.mod({
				className: "tagline",
				hide: true
			});
			var tagfrag = tinput.value.toLowerCase();
			if (tagfrag.charAt(0) == "#")
				tagfrag = tagfrag.slice(1);
			CT.dom.mod({
				className: tagfrag,
				show: true
			});
		} else CT.dom.mod({
			className: "tagline",
			show: true
		});
		this.opts.keyUpCb();
	},
	register: function(nodeId, tinput, opts) {
		opts = CT.merge(opts, {
			tabCb: function () {}
		});
		opts = opts || {};
		this.input = tinput;
		this.tapper = opts.tapCb;

		var n = this.node = opts.node || CT.dom.id(nodeId);
		n.appendChild(CT.dom.node());
		CT.drag.makeDraggable(n, { constraint: "horizontal" });

		this._update();
		CT.gesture.listen("down", tinput, this._returnTrue);
		CT.gesture.listen("up", tinput, this._onUp);
		tinput.onkeyup = this._onKeyUp;
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			enterCb: this._doNothing,
			keyUpCb: this._doNothing,
			expandCb: this._doNothing
		});
	}
});