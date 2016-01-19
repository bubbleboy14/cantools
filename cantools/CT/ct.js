var CT = {
	"_": {
		"extReqs": {},
		"scriptImportCb": {},
		"onImport": function(fullpath) {
			CT._.scriptImportCb[fullpath].forEach(function(cb) { cb(); });
		},
		"onload": [],
		"triggerOnload": function() {
			CT._.onload.forEach(function(cb) { cb(); });
		}
	},
	"style": {
		"panel": {
			"title": "bigger blue bold bottompadded"
		}
	},
	"info": {
		"page": location.pathname.slice(1,-5),
		"userAgent": navigator.userAgent || navigator.vendor || window.opera
	},
	"net": {
		// defaults
		"_path": "",
		"_encode": false,
		"_encoder": function (d) { return d; },
		"_decoder": function (d) { return d; },
		"_silentFail": true,
		// functions
		"setEncoder": function(func) {
			CT.net._encoder = func;
		},
		"setDecoder": function(func) {
			CT.net._decoder = func;
		},
		"fullPath": function(p) {
			if (!CT.net._path) {
				var s = document.getElementsByTagName("script");
				for (var i = 0; i < s.length; i++) {
					if (s[i].src.slice(-8) == "CT/ct.js") {
						CT.net._path = s[i].src.replace("CT/ct.js", "");
						break;
					}
				}
			}
			return CT.net._path + p;
		},
		"xhr": function(path, method, params, async, cb, headers) {
		    var xhr = window.XMLHttpRequest
		    	? new XMLHttpRequest()
		    	: new ActiveXObject("Microsoft.XMLHTTP");
		    xhr.open(method, path, async);
		    if ( !(headers && "Content-Type" in headers))
			    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		    for (var header in headers)
		    	xhr.setRequestHeader(header, headers[header]);
		    xhr.onreadystatechange = cb && function() { cb(xhr); };
		    if (params) {
		    	params = JSON.stringify(params);
		    	if (CT.net._encode)
		    		params = CT.net._encoder(params)
		    }
		    xhr.send(params);
		    if (!async)
		    	return xhr.responseText;
		},
		"_fallback_error": function(msg) {
			if (CT.net._silentFail)
				console.log(msg);
			else
				alert(msg);
		},
		"post": function(path, params, errMsg, cb, eb, headers, cbarg, ebarg) {
			CT.net.xhr(path, "POST", params, true, function(xhr) {
		        if (xhr.readyState == 4) {
		            if (xhr.status == 200) {
		                var data = xhr.responseText.trim();
		                if (CT.net._encode)
		                    data = CT.net._decoder(data);
		                var payload = data.slice(1);
		                if (data.charAt(0) == '0') {
		                    if (eb) eb(payload, ebarg);
		                    else CT.net._fallback_error(errMsg + ": " + payload);
		                }
		                else if (cb != null)
		                    cb(JSON.parse(payload), cbarg);
		            }
		            else if (!CT.net._encode)
		                CT.net._fallback_error("request to " + path + " failed!");
		        }
		    }, headers);
		},
		"get": function(path) {
			return CT.net.xhr(path, "GET");
		}
	},
	"scriptImport": function(modpath, cb, delay) {
		var h = document.getElementsByTagName("head")[0],
			fp = CT.net.fullPath(modpath.replace(/\./g, "/") + ".js");
		if (!(fp in CT._.scriptImportCb)) {
			CT._.scriptImportCb[fp] = [];
			h.appendChild(CT.dom.script(fp));
			h.appendChild(CT.dom.script(null, "CT._.onImport('" + fp + "');", delay));
		}
		if (cb)
			CT._.scriptImportCb[fp].push(cb);
	},
	"require": function(modname, lazy) { // lazy only matters compile-time
		if (modname.slice(0, 4) == "http") {
			if (!(modname in CT._extReqs)) {
				CT._.extReqs[modname] = true;
				eval(CT.net.get(modname));
			}
		} else {
			var modpath = modname.split("."),
				curpath, curmod = window;
			while (curmod && modpath.length) {
				curpath = modpath.shift();
				if (curpath in curmod)
					curmod = curmod[curpath];
				else {
					modpath.unshift(curpath);
					modpath.forEach(function(p, i) {
						if (i == modpath.length - 1)
							curmod[p] = true; // mark module as imported
						else
							curmod = curmod[p] = {};
					});
					modpath.length = 0;
					curmod = null;
				}
			}
			if (!curmod)
				eval(CT.net.get(CT.net.fullPath(modname.replace(/\./g, "/") + ".js")));
		}
	},
	"onload": function(cb) {
		if (!CT._.onload.length)
			window.onload = CT._.triggerOnload;
		CT._.onload.push(cb);
	},
	"merge": function() { // properties on earlier objects trump those on later ones
		var i, k, o = {};
		for (i = arguments.length - 1; i > -1; i--) {
			for (k in arguments[i])
				o[k] = arguments[i][k];
		}
		return o;
	},
	"Class": function(obj, parent) {
		var c = function() {
			var instance = CT.merge(obj, parent && parent.prototype);
			if (parent)
				parent.prototype.fullInit.apply(instance, arguments);
			if (obj.init)
				obj.init.apply(instance, arguments);
			return instance;
		};
		obj.fullInit = c;
		c.prototype = obj;
		return c;
	}
};

// logging
CT.log = function(msg, level) {
	var s = Date() + " ::";
	if (level) for (var i = 0; i < level; i++)
		s += "  ";
	console.log(s, msg);
};
CT.log._silent = false;
CT.log.set = function(bool) {
	CT.log._silent = bool;
};
CT.log.getLogger = function(component) {
	var logger = function() {
		if (!CT.log._silent) {
			var str_arr = [];
			for (var i = 0; i < logger.arguments.length; i++) {
				var a = logger.arguments[i];
				str_arr.push((typeof(a) == "object") ? JSON.stringify(a) : a);
			}
			CT.log("[" + component + "] " + str_arr.join(" "));
		}
	};
	return logger;
};

CT.info.mobile = /android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(CT.info.userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(CT.info.userAgent.substr(0,4));

// shims (fallbacks for old browsers)
if (!window.JSON)
	CT.require("CT.lib.shims.JSON", true);
if (!window.sessionStorage)
	CT.require("CT.lib.shims.sessionStorage", true);
if (!document.createElement("div").classList)
	CT.require("CT.lib.shims.classList", true);