CT.admin.core = {
	q: function(action, cb, errMsg, params, path) {
		params = params || {};
		params.pw = CT.admin.core._pw;
		params.action = action;
		CT.net.post(path || "/admin", params, errMsg, cb);
	},
	credcheck: function(eb, cb) {
		CT.net.post("/_db", { action: "credcheck", pw: CT.admin.core._pw }, null, cb, eb);
	},
	_init: function(pw) {
		var c = CT.admin.core;
		c._pw = pw;
		c._skipinit ? c._initcb() : c.q(c._mode,
			c._initcb, "failed to initialize " + c._mode);
		CT.admin.core.credcheck(function(msg) {
			alert(msg);
			location = "/";
		});
	},
	init: function(mode, cb, skipinit) {
		CT.admin.core._mode = mode;
		CT.admin.core._initcb = cb;
		CT.admin.core._skipinit = skipinit;
		CT.modal.Prompt({
			style: "password",
			prompt: "password?",
			transition: "fade",
			cb: CT.admin.core._init
		}).show();
	}
};
