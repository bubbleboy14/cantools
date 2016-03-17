CT.admin.core = {
	"pw": prompt("password?"),
	"q": function(action, cb, errMsg, params, path) {
		params = params || {};
		params.pw = CT.admin.core.pw;
		params.action = action;
		CT.net.post(path || "/admin", params, errMsg, cb);
	},
	"init": function(action, cb) {
		CT.admin.core.q(action, cb, "failed to initialize " + action);
	}
};
