CT.autocomplete.Guesser = CT.Class({
	data: [],
	_doNothing: function() {},
	_returnTrue: function() { return true; },
	_handleGuess: function(response_data) {
		this.data = CT.data.uniquify(this.data.concat(response_data));
		this._update();
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
	_update: function() {
		this.data.forEach(function(d) {
			if (!CT.dom.id("ac" + d))
				this.addTag(d);
		});
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
				targets = CT.dom.className(tagfrag);
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
				this.guesser(tagfrag, this._handleGuess);
		} else CT.dom.mod({
			className: "tagline",
			show: true
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
		this.input = opts.input;
		this.tapper = opts.tapCb;
		this.guesser = opts.guessCb;
		var nstyle = CT.align.offset(this.input);
		nstyle.top += 20;
		nstyle.width = this.input.clientWidth;
		nstyle.position = "absolute";
		this.node = CT.dom.node(null, null, "autocomplete hider", null, null, nstyle);
		this.node.appendChild(CT.dom.node());
		this._update();
		CT.drag.makeDraggable(this.node, { constraint: "horizontal" });
		CT.gesture.listen("down", tinput, this._returnTrue);
		CT.gesture.listen("up", tinput, this._onUp);
		this.input.onkeyup = this._onKeyUp;
	}
});