/*
This module enables cross-platform, sometimes-native dragging, mostly via
CT.gesture module. The principle function is makeDraggable(), used as follows:

### CT.drag.makeDraggable(node, opts)
This function makes the 'node' node draggable. The 'opts' object may contain
any or all of the following options:

    - constraint ('horizontal' or 'vertical'): prevents drags in indicated direction.
    - interval (number): 'chunks' total drag area into sections, causing drags to
                         always settle on areas corresponding to multiples of 'interval',
                         and swipes to slide between such areas. if value is 'auto',
                         we use width / number_of_child_nodes.
    - force (bool, default false): forces non-native scrolling.
    - up, down, drag, scroll, swipe (functions): optional gesture callbacks.
*/

CT.drag = {
	_direction2constraint: {
		up: "horizontal",
		down: "horizontal",
		left: "vertical",
		right: "vertical"
	},
	nativeScroll: function (n, opts) {
		CT.gesture.listen("up", n, function () {
			if (opts.up)
				opts.up();
			return true;
		}, true, false);
		CT.gesture.listen("down", n, function () {
			if (opts.down)
				opts.down();
			return true;
		}, true, false);
		var dirs = {
			up: "down",
			down: "up",
			right: "left",
			left: "right"
		}, lastDirection, dragTimeout, delayedDrag = function() {
			if (dragTimeout) {
				clearTimeout(dragTimeout);
				dragTimeout = null;
			}
			dragTimeout = setTimeout(function() {
				opts.drag(dirs[lastDirection], 0, 0, 0);
			}, 100);
		};
		CT.gesture.listen("drag", n, function (direction, distance, dx, dy) {
			if (n.noDrag) return;
			var atBottom = (n.parentNode.scrollHeight - n.parentNode.scrollTop 
				=== n.parentNode.clientHeight), atTop = (n.parentNode.scrollTop === 0),
				atLeft = (n.parentNode.scrollLeft === 0), atRight = (n.parentNode.clientWidth 
				+ n.parentNode.scrollLeft === n.parentNode.scrollWidth);
			lastDirection = direction;
			if (opts.drag)
				opts.drag(direction, distance, dx, dy);
			if((atTop && direction == "down") ||
				(atBottom && direction == "up"))
				return false;
			return !opts.constraint ||
				opts.constraint == CT.drag._direction2constraint[direction];
		}, true, false);
		CT.gesture.listen("swipe", n, function (direction, distance, dx, dy, pixelsPerSecond) { 
			if (direction == "up" && (n.parentNode.scrollTop >=
				(n.parentNode.scrollHeight - (n.parentNode.clientHeight + 800)))
				&& opts.swipe)
			{
				opts.swipe();
			}
		}, true, false);
		n.parentNode.addEventListener('scroll', function (event) {
			if (opts.scroll)
				opts.scroll(event);
			if (opts.drag)
				delayedDrag();
			return true;
		}, false);
	},
	makeDraggable: function (node, opts) {
		opts = opts || {};
		if (!opts.interval && !opts.force && !CT.info.isStockAndroid)
			return CT.drag.nativeScroll(node.firstChild, opts);
		var downCallback, upCallback, dragCallback, swipeCallback;
		node.xDrag = 0;
		node.yDrag = 0;
		node.classList.add('hardware-acceleration');
		node.style['-webkit-transform'] = "translate3d(0,0,0)";
		node.parentNode.addEventListener('scroll', function (event) { return false; }, false);
		var getInterval = function() {
			return opts.interval == "auto" ? (CT.align[opts.constraint == "horizontal"
				? "height" : "width"](node) / node.childNodes.length) : opts.interval;
		};
		var downCallback = function () {
			if (node.animating) return;
			node.dragging = false;
			node.touchedDown = true;
			node.animating = false;
			node.xDragStart = node.xDrag;
			node.yDragStart = node.yDrag;
			if (opts.down)
				opts.down();
		};
		var upCallback = function (direction) {
			var xMod = 0, yMod = 0, boundaryReached = false, interval = getInterval();
			node.touchedDown = node.dragging = false;
			if (node.animating == false) {
				if (interval) {
					if (opts.constraint != "vertical") {
						yMod = node.yDrag % interval;
						if (yMod != 0) {
							if (Math.abs(yMod) <= (interval / 2))
								node.yDrag -= yMod;
							else
								node.yDrag -= (interval + yMod);
							if (node.yDrag < node.yDragStart)
								direction = "up";
							else if (node.yDrag > node.yDragStart)
								direction = "down";
							else
								direction = "hold";
						}
					}
					if (opts.constraint != "horizontal") {
						xMod = node.xDrag % interval;
						if (xMod != 0) {
							if (Math.abs(xMod) <= (interval / 2))
								node.xDrag -= xMod;
							else
								node.xDrag -= (interval + xMod);
							if (node.xDrag < node.xDragStart)
								direction = "left";
							else if (node.xDrag > node.xDragStart)
								direction = "right";
							else
								direction = "hold";
						}
					}
					if (direction) {
						node.animating = true;
						CT.trans.translate(node, {
							x: node.xDrag,
							y: node.yDrag,
							cb: function () {
								node.animating = false;
							}
						});
					}
				}
				else {	//boundary checking
					if (opts.constraint != "horizontal") {
						if (node.xDrag > 0) {
							node.xDrag = 0;
							boundaryReached = true;
							direction = "right";
						}
						else if (Math.abs(node.xDrag) > 
							(node.scrollWidth - node.parentNode.clientWidth)) {
							node.xDrag = -(node.scrollWidth - node.parentNode.clientWidth);
							boundaryReached = true;
							direction = "left";
						}
					}
					if (opts.constraint != "vertical") {
						if (node.yDrag > 0) {
							node.yDrag = 0;
							boundaryReached = true;
							direction = "up";
						}
						else if (node.yDrag < 
							-(node.scrollHeight - node.parentNode.clientHeight)) {
							node.yDrag = -(node.scrollHeight - node.parentNode.clientHeight);
							boundaryReached = true;
							direction = "down";
						}
					}
					if (boundaryReached) {
						node.animating = true;
						CT.trans.translate(node, {
							x: node.xDrag,
							y: node.yDrag,
							cb: function () {
								node.animating = false;
								if (opts.drag)
									opts.drag(direction, 0, 0, 0);
								if (opts.scroll)
									opts.scroll();
							}
						});
					}
				}
				if (opts.up)
					opts.up(direction);
			}
		};
		var dragCallback = function (direction, distance, dx, dy) {
			if (node.touchedDown && !node.noDrag) {
				node.dragging = true;
				if (opts.constraint != "vertical") {
					if (node.yDrag > -(node.scrollHeight - 
						 (2 * node.parentNode.clientHeight / 3)))
						node.yDrag += dy;
				}
				if (opts.constraint != "horizontal") {
					if (Math.abs(node.xDrag) < (node.scrollWidth - 
						(2 * node.parentNode.clientWidth / 3)))
						node.xDrag += dx;
				}
				CT.trans.setVenderPrefixed(node, "transform",
					"translate3d(" + node.xDrag + "px," + 
					node.yDrag + "px,0)");
				if (opts.drag) 
					opts.drag(direction, distance, dx, dy);
				if (opts.scroll)
					opts.scroll();
			}
		};
		var swipeCallback = function (direction, distance, dx, dy, pixelsPerSecond) {
			var interval = getInterval(),
				xMod = interval ? node.xDrag % interval : -dx,
				yMod = interval ? node.yDrag % interval : pixelsPerSecond * .3;
			if (node.animating == false) {
				if (opts.constraint != "horizontal" && node.xDrag <= 0 && 
					Math.abs(node.xDrag) < (node.scrollWidth - node.parentNode.clientWidth)) {
					if (direction == "right")
						node.xDrag -= xMod;
					else if (direction == "left")
						node.xDrag += (interval ? -(interval + xMod) : xMod);
					else
						return;
				}
				if (opts.constraint != "vertical" && node.yDrag <= 0 
					&& Math.abs(node.yDrag) > (node.scrollHeight - node.parentNode.clientHeight)) {
					if (direction == "up")
						node.yDrag -= yMod;
					else if (direction == "down")
						node.yDrag -= (interval ? -(interval + yMod) : -yMod);
					else
						return;
				}
				node.animating = true;
				CT.trans.translate(node, {
					x: node.xDrag,
					y: node.yDrag,
					cb: function() {
						node.animating = false;
						upCallback(direction); // legit?
					}
				});
			}
		};

		if (node.isDraggable)
			CT.gesture.unlisten(node);
		node.isDraggable = true;
		CT.gesture.listen("drag", node, dragCallback);
		CT.gesture.listen("down", node, downCallback);
		CT.gesture.listen("swipe", node, swipeCallback);
		CT.gesture.listen("up", node, upCallback);
	}
};
