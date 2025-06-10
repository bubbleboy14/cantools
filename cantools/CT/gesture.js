/*
This module contains functions for registering cross-platform gesture callbacks.
The main one to look out for is listen, defined below.

### CT.gesture.listen(eventName, node, cb, stopPropagation, preventDefault)
    - eventName - one of: drag, swipe, tap, up, down, hold, pinch, hover, wheel
    - node - the node to listen to
    - cb - the function to call when something happens
    - stopPropagation - whether to propagate this event beyond node
    - preventDefault - whether to prevent default behavior
*/

CT.gesture = {
	gid: 0,
	_joy: false,
	preventDefault: true,
	thresholds: {
		joy: {
			maxDistance: 20
		},
		swipe: {
			minDistance: 35,
			maxTime: 400,
			minDP: 600,
			maxDP: 1000
		},
		drag: {
			minDP: 0,
			maxDP: 1000
		},
		tap: {
			maxDistance: 10,
			maxTime: 700,
			waitTime: 300,
			maxCount: 2
		},
		hold: {
			maxDistance: null, // set to pixel value if desired
			interval: 1000
		},
		up: {
			androidDelay: 600
		},
		pinch: {},
		zoom: {
			min: 0.25,
			max: 8,
			slow: 2,
			wheel: {
				enabled: !CT.info.mobile && !CT.info.isMac,
				jump: 0.2
			}
		}
	},
	_vars: {
		active: false,
		startTime: null,
		dragTime: null,
		startPos: null,
		lastPos: null,
		tapCount: 0,
		holdCount: 0,
		zoomLevel: 1,
		tapTimeout: null,
		holdInterval: null,
		stopTimeout: null,
		firstPinch: null,
		stopPropagation: false,
		preventDefault: false,
		iosPinch: false,   // is ready to pinch
		iosPinching: false // is currently pinching
	},
	gevents: {
		GestureStart: "gesturestart",
		GestureChange: "gesturechange",
		GestureEnd: "gestureend"
	},
	events: (CT.info.mobile || CT.info.android || CT.info.iOs) && {
		Start: "touchstart",
		Stop: "touchend",
		Move: "touchmove",
		Cancel: "touchcancel"
	} || {
		Start: "mousedown",
		Stop: "mouseup",
		Move: "mousemove"
	},
	handlers: { joy: {}, drag: {}, swipe: {}, tap: {}, up: {}, down: {}, hold: {}, pinch: {}, hover: {}, wheel: {} },
	setThreshold: function(eventName, constraint, val) {
		CT.gesture.thresholds[eventName][constraint] = val;
	},
	tuneThresholds: function() {
		if (!CT.info.iOs)
			for (var gest in CT.gesture.thresholds)
				for (var constraint in CT.gesture.thresholds[gest]) {
					var suffix = constraint.slice(3);
					if (suffix == "Distance")
						CT.gesture.thresholds[gest][constraint] /= 2;
					else if (suffix == "DP")
						CT.gesture.thresholds[gest][constraint] *= 2;
				}
	},
	setJoy: function(active) {
		CT.gesture._joy = active;
		if (active) {
			CT.gesture._joy = {
				start: CT.dom.div(null, "abs mosthigh notouch w50p h50p redback round hidden"),
				last: CT.dom.div(null, "abs mosthigh notouch w30p h30p blueback round hidden")
			};
			CT.dom.doWhenNodeExists("ctmain", function() {
				CT.dom.addBody(CT.gesture._joy.start);
				CT.dom.addBody(CT.gesture._joy.last);
			});
		}
	},
	joyStart: function() {
		var n, j = CT.gesture._joy;
		if (j)
			for (n in j)
				CT.dom.show(j[n]);
	},
	joyStop: function() {
		var n, j = CT.gesture._joy;
		if (j)
			for (n in j)
				CT.dom.hide(j[n]);
	},
	getPos: function(e) {
		if (e.x == undefined) {
			e.x = e.pageX || e.changedTouches[0].pageX;
			e.y = e.pageY || e.changedTouches[0].pageY;
		}
		return { x: e.x, y: e.y };
	},
	getDiff: function(p1, p2, mp) {
		var d = {};
		d.x = p2.x - p1.x;
		d.y = p2.y - p1.y;
		d.distance = Math.sqrt((d.x * d.x) + (d.y * d.y));
		if (mp) d.midpoint = CT.gesture.getMidpoint([p1,p2]);
		if (Math.abs(d.x) > Math.abs(d.y))
			d.direction = d.x > 0 ? 'right' : 'left';
		else
			d.direction = d.y > 0 ? 'down' : 'up';
		return d;
	},
	pinchDiff: function(e) {
		return CT.info.iOs ? {x:e['pageX'], y:e['pageY']} :
			CT.gesture.getDiff(CT.gesture.getPos(e.touches[0]), 
				CT.gesture.getPos(e.touches[1]), true);
	},
	getMidpoint: function(points) {
		var midpoint = function (coord) {
			return (points[0][coord] + points[1][coord]) / 2;
		};
		return {x:midpoint('x'), y:midpoint('y')};
	},
	pixelsPerSecond: function(distance, timeDiff, gest) {
		var t = CT.gesture.thresholds[gest];
		return Math.min(t.maxDP, Math.max(t.minDP,
			distance / timeDiff)) * (CT.info.iOs ? 1 : 0.5);
	},
	isMulti: function(e) {
		return CT.info.mobile && e.touches.length > 1;
	},
	onGestureStart: function(e, node) {
	},
	onGestureChange: function(e, node) {
		CT.gesture.triggerPinch(node, Math.pow(e.scale, (1/8)),
			CT.gesture.pinchDiff(e));
	},
	onGestureEnd: function(e, node) {
		CT.gesture.triggerPinch(node, Math.pow(e.scale, (1/8)),
			CT.gesture.pinchDiff(e));
		node.gvars.iosPinching = false;
	},
	onStart: function(e, node) {
		var t = CT.gesture.thresholds;
		var v = node.gvars;
		v.active = true;
		v.holdCount = 0;
		v.startTime = v.dragTime = Date.now();
		v.startPos = v.lastPos = CT.gesture.getPos(e);
		if (v.tapTimeout) {
			clearTimeout(v.tapTimeout);
			v.tapTimeout = null;
		}
		if (CT.gesture.isMulti(e)) {
			if (CT.info.android)
				v.firstPinch = CT.gesture.pinchDiff(e);
			else
				v.iosPinching = true;
		} else {
			v.holdInterval = setInterval(function() {
				if (!v.active || (t.hold.maxDistance && (t.hold.maxDistance <
					CT.gesture.getDiff(v.startPos, v.lastPos).distance))) {
					clearInterval(v.holdInterval);
					v.holdInterval = null;
					return;
				}
				v.holdCount += 1;
				CT.gesture.triggerHold(node, t.hold.interval * v.holdCount);
			}, t.hold.interval);
		}
		return CT.gesture.triggerDown(node, CT.gesture.getPos(e));
	},
	onStop: function(e, node, delayed) {
		var v = node.gvars;
		if (!delayed && v.holdInterval) {
			clearInterval(v.holdInterval);
			v.holdInterval = null;
		}
		if (!v.active) return;
		var t = CT.gesture.thresholds;
		var pos = CT.gesture.getPos(e);
		var diff = CT.gesture.getDiff(v.startPos, pos);
		var timeDiff = Date.now() - v.startTime;
		v.active = !!(e.touches && e.touches.length);

		if (!v.active && !v.iosPinching) { // last finger raised
			CT.gesture.joyStop();
			if ( (timeDiff < t.swipe.maxTime)
				&& (diff.distance > t.swipe.minDistance) ) // swipe
				CT.gesture.triggerSwipe(node, diff.direction,
					diff.distance, diff.x, diff.y,
					CT.gesture.pixelsPerSecond(diff.distance, timeDiff, "swipe"));
			else if ( (timeDiff < t.tap.maxTime)
				&& (diff.distance < t.tap.maxDistance) ) { // tap
				v.tapCount += 1;
				if (v.tapCount == t.tap.maxCount)
					CT.gesture.triggerTap(node, pos);
				else
					v.tapTimeout = setTimeout(CT.gesture.triggerTap, t.tap.waitTime, node, pos);
			}
		}
		return CT.gesture.triggerUp(node, delayed);
	},
	onMove: function(e, node) {
		var v = node.gvars, pos = CT.gesture.getPos(e), tmd,
			pdiff, diff, rval, tdiff, now, psnap, jstyle;
		if (v.active) {
			now = Date.now();
			v.lastPos = pos;
			v.dragTime = now;
			if (!CT.gesture.isMulti(e)) {
				rval = CT.info.mobile && CT.gesture.triggerHover(node, pos);
				if (CT.gesture._joy) {
					tmd = CT.gesture.thresholds.joy.maxDistance;
					for (psnap in CT.gesture._joy) {
						jstyle = CT.gesture._joy[psnap].style;
						jstyle.top = (v[psnap + "Pos"].y - 25) + "px";
						jstyle.left = (v[psnap + "Pos"].x - 25) + "px";
					}
					CT.gesture.joyStart();
					return CT.gesture.triggerJoy(node,
						Math.max(-tmd, Math.min(tmd, v.lastPos.x - v.startPos.x)),
						Math.max(-tmd, Math.min(tmd, v.lastPos.y - v.startPos.y)),
						v.startPos, v.lastPos) || rval;
				}
				tdiff = now - v.dragTime;
				diff = CT.gesture.getDiff(v.lastPos, pos);
				return CT.gesture.triggerDrag(node, diff.direction,
					diff.distance, diff.x, diff.y,
					CT.gesture.pixelsPerSecond(diff.distance, tdiff, "drag")) || rval;
			}
			if (CT.info.android) {
				pdiff = CT.gesture.pinchDiff(e);
				CT.gesture.triggerPinch(node,
				 	pdiff.distance / v.firstPinch.distance, pdiff.midpoint);
			}
		} else
			return CT.gesture.triggerHover(node, pos);
	},
	onWheel: function(e, node) {
		CT.gesture.triggerWheel(node, CT.gesture.getPos(e), e.deltaY);
	},
	gWrap: function(node) {
		var e = {};
		['GestureStart', 'GestureChange', 'GestureEnd'].forEach(function(eName) {
			e[eName] = function(_e) {
				_e.preventDefault();
				_e.stopPropagation();
				return CT.gesture['on' + eName](_e, node) || false;
			};
		});
		return e;
	},
	eWrap: function(node) {
		var e = {};
		['Start', 'Stop', 'Move'].forEach(function(eName) {
			e[eName] = function(_e) {
				node.gvars.preventDefault && _e.preventDefault();
				node.gvars.stopPropagation && _e.stopPropagation();
				return CT.gesture['on' + eName](_e, node) || (CT.gesture.preventDefault 
					&& _e.preventDefault()) || _e.stopPropagation() || false;
			};
		});
		if (CT.gesture.events.Cancel)
			e.Cancel = e.Stop;
		return e;
	},
	zoom: function(node, normalizedDistance, midpoint) {
		var t = CT.gesture.thresholds.zoom, v = node.gvars;
		v.zoomLevel = node.style.zoom = Math.max(t.min, Math.min(t.max,
			Math.pow(normalizedDistance * v.zoomLevel, 1 / t.slow)));
	},
	pinch2zoom: function(node) {
		var w = CT.gesture.thresholds.zoom.wheel, v = node.gvars;
		CT.gesture.listen('pinch', node, function(normalizedDistance, midpoint) {
			CT.gesture.zoom(node, normalizedDistance, midpoint);
		}, true, true);
		w.enabled && CT.gesture.listen("wheel", node, function(pos, delta) {
			CT.gesture.zoom(node, v.zoomLevel * (1 +
				(delta > 0 ? -w.jump : w.jump)), pos);
		});
	},
	listen: function(eventName, node, cb, stopPropagation, preventDefault) {
		if (!node.gid) {
			node.gid = ++CT.gesture.gid;
			var e = node.listeners = CT.gesture.eWrap(node);
			for (var evName in CT.gesture.events)
				node.addEventListener(CT.gesture.events[evName], e[evName]);
			node.gvars = CT.merge(CT.gesture._vars);
		}
		if (eventName == "pinch" && CT.info.iOs) {
			var _e = CT.gesture.gWrap(node);
			for (var evName in CT.gesture.gevents)
				node.addEventListener(CT.gesture.gevents[evName], _e[evName]);
			for (var k in _e)
				node.listeners[k] = _e[k];
			node.gvars.iosPinch = true;
		}
		else if (eventName == "wheel" && !node.listeners.wheel) {
			node.listeners.wheel = function(e) { CT.gesture.onWheel(e, node); };
			node.addEventListener("wheel", node.listeners.wheel);
		}
		node.gvars.stopPropagation = stopPropagation;
		node.gvars.preventDefault = preventDefault;
		if (!CT.gesture.handlers[eventName][node.gid])
			CT.gesture.handlers[eventName][node.gid] = [];
		CT.gesture.handlers[eventName][node.gid].push(cb);
	},
	unlisten: function(node) {
		if (node.gid) {
			var e = node.listeners;
			for (var evName in CT.gesture.events)
				node.removeEventListener(CT.gesture.events[evName], e[evName]);
			if (node.gvars.iosPinch) {
				for (var evName in CT.gesture.gevents)
					node.removeEventListener(CT.gesture.gevents[evName], e[evName]);
			}
			if (e.wheel)
				node.removeEventListener("wheel", e.wheel);
			for (var eventName in CT.gesture.handlers)
				if (node.gid in CT.gesture.handlers[eventName])
					delete CT.gesture.handlers[eventName][node.gid];
			delete node.gid;
		}
	},
	triggerPinch: function(node, normalizedDistance, midpoint) {
		var handlers = CT.gesture.handlers.pinch[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			handlers[i](normalizedDistance, midpoint);
	},
	triggerSwipe: function(node, direction, distance, dx, dy, pixelsPerSecond) {
		var handlers = CT.gesture.handlers.swipe[node.gid];
		hasSwiped = true;
		if (handlers) for (var i = 0; i < handlers.length; i++)
			handlers[i](direction, distance, dx, dy, pixelsPerSecond);
	},
	triggerTap: function(node, pos) {
		var v = node.gvars;
		var handlers = CT.gesture.handlers.tap[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			handlers[i](v.tapCount, pos);
		v.tapCount = 0;
		v.tapTimeout = null;
	},
	triggerJoy: function(node, dx, dy, startPos, lastPos) {
		var returnVal = false;
		var handlers = CT.gesture.handlers.joy[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			returnVal = handlers[i](dx, dy, startPos, lastPos) || returnVal;
		return returnVal;
	},
	triggerDrag: function(node, direction, distance, dx, dy, pixelsPerSecond) {
		var returnVal = false;
		var handlers = CT.gesture.handlers.drag[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			returnVal = handlers[i](direction, distance, dx, dy, pixelsPerSecond) || returnVal;
		return returnVal;
	},
	triggerHover: function(node, pos) {
		var returnVal = false;
		var handlers = CT.gesture.handlers.hover[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			returnVal = handlers[i](pos) || returnVal;
		return returnVal;
	},
	triggerWheel: function(node, pos, delta) {
		var handlers = CT.gesture.handlers.wheel[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			handlers[i](pos, delta);
	},
	triggerHold: function(node, duration) {
		var handlers = CT.gesture.handlers.hold[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			handlers[i](duration);
	},
	triggerUp: function(node, delayed) {
		var returnVal = false;
		var handlers = CT.gesture.handlers.up[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			returnVal = handlers[i](delayed) || returnVal;
		return returnVal;
	},
	triggerDown: function(node, pos) {
		var returnVal = false;
		var handlers = CT.gesture.handlers.down[node.gid];
		if (handlers) for (var i = 0; i < handlers.length; i++)
			returnVal = handlers[i](pos) || returnVal;
		return returnVal;
	}
};
CT.gesture.tuneThresholds();
