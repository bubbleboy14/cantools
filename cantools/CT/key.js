/*
This module supports global key bindings.
*/

CT.key = {
	_codes: [null, null, null, null, null, null, null, null, "BACKSPACE", "TAB",
		null, null, null, "ENTER", null, null, "SHIFT", "CTRL", "ALT", null, "CAPS",
		null, null, null, null, null, null, "ESCAPE", null, null, null, null, "SPACE",
		"PAGE_UP", "PAGE_DOWN", "END", "HOME", "LEFT", "UP", "RIGHT", "DOWN", null,
		"PRINT", null, null, "INSERT", "DELETE", null, "0", "1", "2", "3", "4", "5",
		"6", "7", "8", "9", null, null, null, null, null, null, null, "a", "b", "c",
		"d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
		"s", "t", "u", "v", "w", "x", "y", "z", "META_LEFT", "META_RIGHT", "SELECT",
		null, null, "NUMPAD_0", "NUMPAD_1", "NUMPAD_2", "NUMPAD_3", "NUMPAD_4",
		"NUMPAD_5", "NUMPAD_6", "NUMPAD_7", "NUMPAD_8", "NUMPAD_9", "MULTIPLY",
		"ADD", null, "SUBTRACT", "DECIMAL_POINT", "DIVIDE", "F1", "F2", "F3", "F4",
		"F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", null, null, null, null,
		null, null, null, null, null, null, null, null, null, null, null, null, null,
		null, null, null, "NUM_LOCK", "SCROLL_LOCK", null, null, null, null, null,
		null, null, null, null, null, null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null, null, "SEMICOLON", "EQUALS",
		"COMMA", "DASH", "PERIOD", "FORWARD_SLASH", "GRAVE_ACCENT", null, null, null,
		null, null, null, null, null, null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null, null, null, "OPEN_BRACKET",
		"BACK_SLASH", "CLOSE_BRACKET", "QUOTE"],
	_cbs: {},
	_downcbs: {},
	_downs: [],
	_init: function() {
		if (!CT.key._initialized) {
			CT.key._initialized = true;
			window.onkeyup = CT.key._onUp;
			window.onkeydown = CT.key._onDown;
		}
	},
	_onDown: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which,
			character = CT.key._codes[code];
		CT.data.append(CT.key._downs, character);
		CT.key._setEvent(e);
		CT.key.trig(character, true);
	},
	_onUp: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which,
			character = CT.key._codes[code];
		CT.data.remove(CT.key._downs, character);
		CT.key._setEvent(e);
		CT.key.trig(character);
	},
	_setEvent: function(event) {
		CT.key._event = event;
		CT.key.capslocked = event.getModifierState("CapsLock");
	},
	_active: function(character) {
		var az = CT.key._actives;
		return !az || az.includes(character);
	},
	setActive: function(actives) {
		CT.key._actives = actives;
	},
	preDe: function() {
		CT.key._event.preventDefault();
	},
	stopProp: function() {
		CT.key._event.stopPropagation();
	},
	trig: function(char, down) {
		var k = CT.key, cbs = down ? k._downcbs : k._cbs;
		k._active(char) && cbs[char] && cbs[char]();
	},
	clear: function(character, noescape) {
		var eu, ed, k = CT.key, e, escapers = {},
			ecfg = core.config.modals.escapers || [];
		if (character) {
			delete k._cbs[character];
			delete k._downcbs[character];
		} else {
			if (noescape) {
				eu = k._cbs.ESCAPE;
				ed = k._downcbs.ESCAPE;
				for (e of ecfg) {
					escapers[e] = {
						up: k._cbs[e],
						down: k._downcbs[e]
					};
				}
			}
			k._cbs = {};
			k._downcbs = {};
			if (noescape && (eu || ed)) {
				k.on("ESCAPE", eu, ed);
				for (e of ecfg)
					k.on(e, escapers[e].up, escapers[e].down);
			}
		}
	},
	downs: function(chars) {
		return chars.filter(function(c) { return CT.key._downs.includes(c) });
	},
	down: function(character) {
		CT.key._init();
		return CT.key._downs.indexOf(character) != -1;
	},
	on: function(character, onup, ondown) {
		CT.key._init();
		CT.key._cbs[character] = onup;
		if (ondown)
			CT.key._downcbs[character] = ondown;
	}
};