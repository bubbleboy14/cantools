CT.admin.core = {
	"pw": prompt("password?"),
	"q": function(action, cb, errMsg, params) {
		params = params || {};
		params.pw = CT.admin.pw;
		params.action = action;
		CT.net.post("/admin", params, errMsg, cb);
	},
	"init": function(action, cb) {
		CT.admin.q(action, cb, "failed to initialize " + action);
	}
};
