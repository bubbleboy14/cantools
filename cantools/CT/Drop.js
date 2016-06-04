/*
This class makes a drop-down menu, and can be subclassed
into things like the CT.autocomplete classes.
*/

CT.Drop = CT.Class({
	CLASSNAME: "CT.Drop",
	_position: function() {
		var ipos = CT.align.offset(this.opts.anchor);
		this.node.style.width = (this.opts.anchor.clientWidth + 2) + "px";
		this.node.style.top = (ipos.top + this.opts.anchor.clientHeight) + "px";
		this.node.style.left = (ipos.left + 2) + "px";
	},
	_hide: function() {
		this.node.className = "drop hider";
	},
	expand: function(cb) {
		var n = this.node;
		this._position();
		this.viewing = true;
		n.className = "drop drop-open";
		CT.trans.trans({
			node: n,
			cb: function() {
				n.className += " drop-auto-over";
				cb && cb();
			}
		});
	},
	retract: function() {
		if (!this.viewing)
			return;
		this.viewing = false;
		this.node.className = "drop";
		CT.trans.trans({
			node: this.node,
			cb: this._hide
		});
	},
	slide: function() {
		if (this.viewing)
			this.retract();
		else
			this.expand();
	},
	_setAnchor: function() {
		if (this.opts.setClick)
			this.opts.anchor.onclick = this.slide;
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			content: CT.dom.node(),
			setClick: true
		});
		this.node = CT.dom.node(opts.content, null, "drop hider");
		this.node.onclick = this.slide;
		document.body.appendChild(this.node);
		CT.drag.makeDraggable(this.node, { constraint: "horizontal" });
		setTimeout(this._setAnchor); // for subclasses that define anchor in constructor
	}
});