CT.Pager = CT.Class({
	"offset": 0,
	"limit": 20,
	"data": [],
	"init": function(renderCb, requestCb, limit) {
		this.id = CT.Pager._id;
		CT.Pager._id += 1;
		this.log = CT.log.getLogger("CT.Pager(" + this.id + ")");
		this.log("init");
		this._renderCb = renderCb;
		this._requestCb = requestCb;
		if (limit)
			this.limit = limit;
		this._build();
	},
	"_build": function() {
		this.log("_build");
		this.content = CT.dom.node();
		this.next = CT.dom.button("next", this._next);
		this.previous = CT.dom.button("previous", this._previous);
		this.node = CT.dom.node([
			this.content, this.next, this.previous
		]);
		this.node.pager = this;
		this._load();
	},
	"_next": function() {
		this.offset += this.limit;
		this.log("_next", "offset", this.offset, "limit", this.limit);
		this._load();
	},
	"_previous": function() {
		this.offset -= this.limit;
		this.log("_previous", "offset", this.offset, "limit", this.limit);
		this._load();
	},
	"_updateButtons": function() {
		this.log("_updateButtons");
		if (this.offset == 0)
			CT.dom.hide(this.previous);
		else if (this.offset == this.limit)
			CT.dom.show(this.previous);
		if (this.max)
			CT.dom[((this.offset + this.limit) >= this.max) ? "hide" : "show"](this.next);
	},
	"_render": function() {
		this.log("_render");
		this.content.innerHTML = "";
		this.content.appendChild(this._renderCb(this.data.slice(this.offset,
			this.offset + this.limit)));
	},
	"_refill": function(data) {
		this.log("_refill");
		this.data = this.data.concat(data);
		this._load();
	},
	"_load": function() {
		this.log("_load");
		if ((this.offset + this.limit) <= this.data.length) {
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