/*
This module is all about hover nodes. Want a hover node?
Well, use this module.
*/

CT.hover = {
	_: {},
	_pos: function(n) {
		return [n.offsetLeft, n.offsetTop];
	},
	_hide: function() {
		var _ = CT.hover._;
		setTimeout(function() {
			!_.nodeOn && !_.hoverOn && CT.dom.hide(_.infoBubble);
		}, 1000);
	};
	set: function(node, content, poptop, stayopen) {
		if (arguments.length == 1 && !(node instanceof Node)) {
			var obj = arguments[0];
			node = obj.node;
			content = obj.content;
			poptop = obj.poptop;
			stayopen = obj.stayopen;
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
			CT.log("node in");
			_.nodeOn = true;
			var npos = CT.hover._pos(node); // recheck every time in case target moves
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
		};
		node.onmouseout = function() {
			CT.log("node out");
			_.nodeOn = false;
			CT.hover._hide();
		};
		if (stayopen) {
			content.onmouseover = function(e) {
				CT.log("hover in");
				_.hoverOn = true;
			};
			content.onmouseout = function(e) {
				CT.log("hover out");
				_.hoverOn = false;
				CT.hover._hide();
			};
		}
		return node;
	}
};