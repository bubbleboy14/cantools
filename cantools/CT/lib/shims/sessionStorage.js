window.sessionStorage = {
	_cur: {},
	init: function() {
		var c = document.cookie;
		if (c.indexOf("ss=") != -1)
			sessionStorage._cur = JSON.parse(c.split("ss=")[1].split(";")[0]);
	},
	getItem: function(key) {
		return sessionStorage._cur[key];
	},
	setItem: function(key, val) {
		sessionStorage._cur[key] = val;
		document.cookie = "ss=" + JSON.stringify(sessionStorage._cur);
	}
};
window.sessionStorage.init();