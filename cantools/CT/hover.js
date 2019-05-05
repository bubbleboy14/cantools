/*
This module is all about hover nodes. Want a hover node?
Well, use this module.
*/

CT.hover = {
	_: {},
	_pos: function(n, recursive, auto) {
		if (auto) {
			var rect = n.getBoundingClientRect();
			return [rect.left, rect.top];
		}
		if (recursive) {
			var left = 0, top = 0;
			while (!isNaN(n.offsetLeft) && n != CT.dom.ALLNODE) {
				left += n.offsetLeft;
				top += n.offsetTop;
				n = n.parentNode;
			}
			return [left, top];
		}
		return [n.offsetLeft, n.offsetTop];
	},
	_hide: function() {
		var _ = CT.hover._;
		setTimeout(function() {
			!_.nodeOn && !_.hoverOn && CT.dom.hide(_.infoBubble);
		}, 1000);
	},
	set: function(node, content, poptop, stayopen, recursive, auto) {
		if (arguments.length == 1 && !(node instanceof Node)) {
			var obj = arguments[0];
			node = obj.node;
			content = obj.content;
			poptop = obj.poptop;
			stayopen = obj.stayopen;
			recursive = obj.recursive;
			auto = obj.auto;
		}
		var _ = CT.hover._;
		if (!_.infoBubble) {
			_.infoBubble = CT.dom.div("", "small hidden infobubble");
			CT.dom.getAllNode(true).appendChild(_.infoBubble);
			_.bubbleBounds = {
				'left': 0,
				'top': 0
			};
		}
		node.onmouseover = function(e) {
			_.nodeOn = true;
			var npos = CT.hover._pos(node, recursive, auto); // recheck every time in case target moves
			CT.dom.ALLNODE.appendChild(_.infoBubble);
			CT.dom.setContent(_.infoBubble, content);
			CT.dom.show(_.infoBubble);
			var voffset = poptop ? -(_.infoBubble.clientHeight + 10)
				: ((node.clientHeight || node.offsetHeight) + 10);
			_.bubbleBounds.right = CT.dom.ALLNODE.clientWidth - _.infoBubble.clientWidth;
			_.bubbleBounds.bottom = CT.dom.ALLNODE.clientHeight - _.infoBubble.clientHeight;
			_.infoBubble.style.left = Math.min(_.bubbleBounds.right - 10,
				Math.max(10, npos[0] - (_.infoBubble.clientWidth - (node.clientWidth || node.offsetWidth)) / 2)) + "px";
			_.infoBubble.style.top = (npos[1] + voffset) + "px";
			auto && e.stopPropagation();
		};
		node.onmouseout = function() {
			_.nodeOn = false;
			CT.hover._hide();
		};
		if (stayopen) {
			content.onmouseover = function(e) {
				_.hoverOn = true;
			};
			content.onmouseout = function(e) {
				_.hoverOn = false;
				CT.hover._hide();
			};
		}
		return node;
	}
};