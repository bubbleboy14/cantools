CT.log = function(msg, level) {
	if (CT.log._silent)
		return;
	for (var i = 0; i < CT.log.grep._ins.length; i++)
		if (msg.indexOf(CT.log.grep._ins[i]) == -1)
			return;
	for (var i = 0; i < CT.log.grep._outs.length; i++)
		if (msg.indexOf(CT.log.grep._outs[i]) != -1)
			return;
	var s = Date() + " ::";
	if (level) for (var i = 0; i < level; i++)
		s += "  ";
	console.log(s, msg);
};

CT.log.grep = function(ins, outs) {
	CT.log.grep._ins = ins || [];
	CT.log.grep._outs = outs || [];
};
CT.log.grep._ins = [];
CT.log.grep._outs = [];

CT.log.set = function(bool) {
	CT.log._silent = bool;
};
CT.log.getLogger = function(component) {
	var logger = function() {
		var str_arr = [];
		for (var i = 0; i < logger.arguments.length; i++) {
			var a = logger.arguments[i];
			str_arr.push((typeof(a) == "object") ? JSON.stringify(a) : a);
		}
		CT.log("[" + component + "] " + str_arr.join(" "));
	};
	return logger;
};