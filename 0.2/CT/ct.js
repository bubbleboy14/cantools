var CT = {
	"net": {
		// defaults
		"_encode": false,
		"_processPostParams": JSON.stringify,
		// functions
		"xhr": function(path, method, params, async, cb) {
		    var xhr = window.XMLHttpRequest
		    	? new XMLHttpRequest()
		    	: new ActiveXObject("Microsoft.XMLHTTP");
		    xhr.open(method, path, async);
		    xhr.setRequestHeader("Content-Type",
		    	"application/x-www-form-urlencoded");
		    xhr.onreadystatechange = cb;
		    xhr.send(CT.net._processPostParams(params));
		    if (!async)
		    	return xhr.responseText;
		},
		"post": function(path, params, errMsg, cb, eb, cbarg, ebarg) {
			CT.net.xhr(path, "POST", params, true, function() {
		        if (xhr.readyState == 4) {
		            if (xhr.status == 200) {
		                var data = xhr.responseText;
		                if (CT.net._encode)
		                    data = flipSafe(data);
		                if (data.charAt(0) == '0') {
		                    if (eb) eb(data.slice(1), ebarg);
		                    else alert(errMsg+": "+data.slice(1));
		                }
		                else if (cb != null)
		                    cb(eval("("+data.slice(1)+")"), cbarg);
		            }
		            else if (!CT.net._encode)
		                alert("request to "+path+" failed!");
		        }
		    });
		},
		"get": function(path) {
			return CT.net.xhr(path, "GET");
		}
	},
	"require": function(modname) {
		var modpath = modname.split("."),
			curmod = window;
		while (curmod && modpath.length)
			curmod = curmod[modpath.shift()];
		if (!curmod)
			eval(CT.net.get(modname.replace(/\./g, "/") + ".js"));
	}
};