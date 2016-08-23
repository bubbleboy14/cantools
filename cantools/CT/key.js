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
	_init: function() {
		if (!CT.key._initialized) {
			CT.key._initialized = true;
			window.onkeyup = CT.key._onUp;
		}
	},
	_onUp: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which,
			character = CT.key._codes[code];
		CT.key._cbs[character] && CT.key._cbs[character]();
	},
	on: function(character, cb) {
		CT.key._init();
		CT.key._cbs[character] = cb;
	}
};