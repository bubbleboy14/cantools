/*
This class makes a drop-down menu, and can be subclassed
into things like the CT.autocomplete classes.
*/

CT.Drop = CT.Class({
	CLASSNAME: "CT.Drop",
	_position: function() {
		var ipos = CT.align.offset(this.anchor);
		if (this.opts.setWidth)
			this.node.style.width = (this.anchor.clientWidth + 2) + "px";
		this.node.style.top = (ipos.top + this.anchor.clientHeight) + "px";
		this.node.style.left = (ipos.left + 2) + "px";
	},
	_hide: function() {
		this.node.className = this.className + " hider";
		this.opts.onHide && this.opts.onHide();
	},
	expand: function(cb) {
		cb = cb || this.opts.onShow;
		var n = this.node;
		!this.opts.relative && this._position();
		this.viewing = true;
		if (this.opts.constrained)
			n.className = this.className + " drop-open";
		else {
			n.className = this.className;
			n.style.maxHeight = this.opts.content.scrollHeight + "px";
		}
		CT.trans.trans({
			node: n,
			cb: function() {
				n.className += " scrolly";
				cb && cb();
			}
		});
	},
	retract: function() {
		if (!this.viewing)
			return;
		this.viewing = false;
		this.node.className = this.className;
		if (!this.opts.constrained)
			this.node.style.maxHeight = "0px";
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
			this.anchor.onclick = this.slide;
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			content: CT.dom.node(),
			parent: document.body,
			rows: false,
			relative: false,
			setClick: true,
			setNodeClick: true,
			setWidth: true,
			constrained: true
		});
		this.className = opts.relative ? "relative drop" : "whiteback drop above";
		if (opts.rows)
			this.className += " drop-rows";
		this.anchor = opts.anchor;
		this.node = CT.dom.node(opts.content, null, this.className + " hider");
		if (opts.setNodeClick)
			this.node.onclick = this.slide;
		opts.parent.appendChild(this.node);
		CT.drag.makeDraggable(this.node, { constraint: "horizontal" });
		setTimeout(this._setAnchor); // for subclasses that define anchor in constructor
	}
});