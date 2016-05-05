"""
This class is used to generate a pager, which is a self-refilling DOM element.

The constructor takes four positional arguments:
 - renderCb: function that returns formatted content given an array of data objects
 - requestCb: function that acquires new raw data
 - limit (default: 20): number of items to request/display at a time
 - nodeClass (optional): CSS class of pager DOM node
 - nodeId (optional): CSS id of pager DOM node
"""

CT.Pager = CT.Class({
	"CLASSNAME": "CT.Pager",
	"offset": 0,
	"limit": 20,
	"data": [],
	"init": function(renderCb, requestCb, limit, nodeClass, nodeId) {
		this.id = CT.Pager._id;
		CT.Pager._id += 1;
		this._renderCb = renderCb;
		this._requestCb = requestCb;
		if (limit)
			this.limit = limit;
		this._build(nodeClass, nodeId);
	},
	"remove": function(d) {
		CT.data.remove(this.data, d);
		this._load();
	},
	"_build": function(nodeClass, nodeId) {
		this.content = CT.dom.node();
		this.next = CT.dom.button("next", this._next);
		this.previous = CT.dom.button("previous", this._previous);
		this.node = CT.dom.node([
			this.content, this.previous, this.next
		], null, nodeClass, nodeId);
		this.node.pager = this;
		this._load();
	},
	"_next": function() {
		this.offset += this.limit;
		this._load();
	},
	"_previous": function() {
		this.offset -= this.limit;
		this._load();
	},
	"_updateButtons": function() {
		if (this.offset == 0)
			CT.dom.hide(this.previous);
		else if (this.offset == this.limit)
			CT.dom.show(this.previous, "inline");
		if (this.max)
			CT.dom[((this.offset + this.limit) >= this.max) ? "hide" : "show"](this.next, "inline");
	},
	"_render": function() {
		CT.dom.setContent(this.content, this._renderCb(this.data.slice(this.offset,
			this.offset + this.limit)));
	},
	"_refill": function(data) {
		CT.data.addSet(data);
		this.data = this.data.concat(data);
		if (data.length < this.limit) {
			this.max = this.data.length;
			this.full = true;
		}
		this._load();
	},
	"_load": function() {
		if (this.full || (this.offset + this.limit) <= this.data.length) {
			this._render();
			this._updateButtons();
		} else {
			this._requestCb({
				"limit": this.limit,
				"offset": this.offset
			}, this._refill);
		}
	}
});
CT.Pager._id = 0;