/*
This is the cantools bootstrapper. This means that it must be included in
a regular script tag in the head of your html file. It contains the core
functionality of the framework, as follows.

### CT.net
#### This is where the network stuff lives. Highlights:
	- CT.net.post(path, params, errMsg, cb, eb, headers, cbarg, ebarg)
	  - issues a POST request via asynchronous XHR
	- CT.net.get(path, qsp, isjson, ctjson)
	  - issues a GET request via synchronous XHR
	  - optionally parses query string object and unpacks response as JSON
	- CT.net.put(path, params, cb, headers)
	  - issues a PUT request via asynchronous XHR
	- CT.net.delete(path, params, cb, headers)
	  - issues a DELETE request via asynchronous XHR

#### Also includes:
	- CT.net.setMode(string) (default: 'ct')
	  - also supports:
	    - 'basic', which skips request prepping and response code processing
	    - 'passthrough', which does nothing (doesn't even JSON stringify)
	- CT.net.setSpinner(bool) (default: false)
	  - enables/disables spinner (indicating outstanding request)
	- CT.net.setCache(bool) (default: false)
	  - enables/disables client-side request caching
	- CT.net.setSilentFail(bool) (default: true)
	  - enables/disables alert-level error reporting (if otherwise undefined)
	- CT.net.setEncoder(func)
	  - sets encoder (upstream data processing function)
	  - must be used in conjunction with cantools.web.setenc()
	- CT.net.setDecoder(func)
	  - sets decoder (downstream data processing function)
	  - must be used in conjunction with cantools.web.setdec()
	- CT.net.xhr(path, method, params, async, cb, headers)
	  - thin wrapper around browser-level XHR abstraction

### CT.require(modname, lazy)
This is the basis of the cantools module system. Any time your code requires
a module (CT or otherwise), simply call CT.require('MyProject.submodule.whatever')
to dynamically pull in the necessary code. When your project is compiled in
production mode, these imports are baked into the host HTML file, _except_
those flagged 'lazy' (second argument is 'true').

### CT.scriptImport(modpath, cb, delay)
This function supports the importation of libraries that only work if they
know their path (which they ascertain by checking their own script tag).
This includes many popular libraries, such as TinyMCE and Google Maps.

### CT.onload(cb)
Registers a callback to be fired when the window loads.

### CT.merge()
Merges arbitrary number of objects into new object and returns result.

### CT.Class(obj, parent)
This function creates a cantools class. The first argument is a class
definition, an object containing all the functions and properties
belonging to the class. The second (optional) argument is the base
class from which to inherit.

If the class definition includes a 'CLASSNAME' property, this is used
for logging (each class instance has its own 'log' function). Otherwise,
a warning is generated.

If the class definition includes an 'init' function, this function
becomes the class constructor, which is called when an instance is
created (var instance_of_ClassA = new ClassA([args])).

All class functions are bound to the instance, including those
embedded in data structures.

### CT.log
This module contains functions for logging, acquiring specific loggers,
and filtering log output, as well as timing functions for profiling code.

### shims
In addition to the above functions and modules, the cantools bootstrapper provides a
number of shims - fallback implementations of key functionality - for old browsers.
These are required lazily, meaning that they are _not_ included in production-compiled
code, and they're only imported as needed (when missing from browser).

#### These include:
	- JSON
	- sessionStorage
	- classList
	- requestAnimationFrame
	- Object.values
	- addEventListener
*/

var CT = {
	"_": {
		"extReqs": {},
		"scriptImportCb": {},
		"onImport": function(fullpath) {
			CT._.scriptImportCb[fullpath].forEach(function(cb) { cb(); });
		},
		"triggerOnload": function(n) {
			(n || window)._ct_onload.forEach(function(cb) { cb(); });
		}
	},
	"info": {
		"page": location.pathname.slice(1,-5),
		"userAgent": navigator.userAgent || navigator.vendor || window.opera
	},
	"net": {
		// defaults
		"_path": "",
		"_mode": "ct",
		"_cache": false,
		"_encode": false,
		"_spinner": false,
		"_encoder": function (d) { return d; },
		"_decoder": function (d) { return d; },
		"_silentFail": true,
		// functions
		"setMode": function(mode) {
			if (mode != "ct" && mode != "basic" && mode != "passthrough") {
				CT.log("CT.net.setMode() - illegal mode specified: " + mode);
				CT.log("mode must be one of: 'ct', 'basic', 'passthrough'");
			} else
				CT.net._mode = mode;
		},
		"setSilentFail": function(bool) {
			CT.net._silentFail = bool;
		},
		"setSpinner": function(bool) {
			CT.net._spinner = bool;
		},
		"setCache": function(bool) {
			CT.net._cache = bool;
		},
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
		"xhr": function(path, method, params, async, cb, headers, passthrough) {
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
				if (!passthrough && CT.net._mode != "passthrough") {
					if (CT.net._mode == "ct")
						params = CT.net._rd(params, true);
					params = JSON.stringify(params);
				}
				if (CT.net._encode)
					params = CT.net._encoder(params);
			}
			xhr.send(params);
			if (!async)
				return xhr.responseText;
		},
		"_fallback_error": function(msg) {
			if (CT.net._silentFail)
				CT.log(msg);
			else
				alert(msg);
		},
		"_u2l": function (s) {
			return encodeURIComponent(s);
		},
		"_l2u": function (s) {
			return decodeURIComponent(s);
		},
		"_rd": function(d, enc) {
			if (d) {
				if (typeof d == "string")
					return CT.net[(enc ? "_u2l" : "_l2u")](d);
				if (typeof d == "object") {
					var k, o = Array.isArray(d) ? [] : {};
					for (k in d)
						o[k] = CT.net._rd(d[k], enc);
					return o;
				}
			}
			return d;
		},
		"_ctsuccess": function(data, signature, b64) {
			var pl = JSON.parse(data);
			if (b64) pl = CT.net._rd(pl);
			if (CT.net._cache)
				CT.storage.set(signature, pl);
			return pl;
		},
		"_ctresponse": function(data, signature) {
			if (CT.net._encode)
				data = CT.net._decoder(data);
			var code = data.charAt(0), result = {
				success: !!(code % 2)
			};
			data = data.slice(1);
			if (code == "2")
				result.data = atob(data); // is a string
			else if (result.success)
				result.data = CT.net._ctsuccess(data, signature, code == "3");
			return result;
		},
		"post": function(path, params, errMsg, cb, eb, headers, cbarg, ebarg) {
			var signature = path + JSON.stringify(params);
			if (CT.net._cache) {
				var cachedVersion = CT.storage.get(signature);
				if (cachedVersion)
					return cb(cachedVersion, cbarg);
			}
			cb = cb || function() {};
			eb = eb || function(payload) {
				CT.net._fallback_error((errMsg || "error") + ": " + payload);
			};
			if (CT.net._spinner) {
				CT.net._spinner_node = CT.net._spinner_node || CT.dom.spinner();
				document.body.appendChild(CT.net._spinner_node);
			}
			CT.net.xhr(path, "POST", params, true, function(xhr) {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						if (CT.net._spinner)
							CT.dom.remove(CT.net._spinner_node);
						var data = xhr.responseText.trim();
						if (CT.net._mode == "ct") {
							var result = CT.net._ctresponse(data, signature);
							if (result.success)
								cb(result.data, cbarg);
							else
								eb(result.data, ebarg);
						} else
							cb(CT.net._ctsuccess(data, signature), cbarg);
					} else
						eb("request to " + path + " failed! (" + xhr.status + " - " + xhr.responseText + ")", ebarg);
				}
			}, headers);
		},
		"put": function(path, params, cb, headers, passthrough) {
			CT.net.xhr(path, "PUT", params, true, cb, headers, passthrough);
		},
		"del": function(path, params, cb, headers) {
			CT.net.xhr(path, "DELETE", params, true, cb, headers);
		},
		"qs": function(path, qsp) {
			path = path || "";
			if (qsp) {
				var qs = [];
				for (var key in qsp)
					qs.push(key + "=" + escape(qsp[key]));
				path += "?" + qs.join("&");
			}
			return path;
		},
		"get": function(path, qsp, isjson, ctjson) {
			var d, cachedVersion, cache = CT.net._cache && (isjson || ctjson);
			path = CT.net.qs(path, qsp);
			if (cache) {
				cachedVersion = CT.storage.get(path);
				if (cachedVersion)
					return cachedVersion;
			}
			d = CT.net.xhr(path, "GET");
			if (ctjson)
				d = CT.net._ctresponse(d, path).data;
			else {
				if (isjson)
					d = JSON.parse(d);
				if (cache)
					CT.storage.set(path, d);
			}
			return d;
		}
	},
	"scriptImport": function(modpath, cb, delay) {
		var h = document.getElementsByTagName("head")[0],
			fp = (modpath.slice(0, 4) == "http") && modpath
				|| (CT.net.fullPath(modpath.replace(/\./g, "/") + ".js")),
			fresh = !(fp in CT._.scriptImportCb);
		if (fresh)
			CT._.scriptImportCb[fp] = [];
		if (cb)
			CT._.scriptImportCb[fp].push(cb);
		if (fresh) {
			h.appendChild(CT.dom.script(fp));
			h.appendChild(CT.dom.script(null, "CT._.onImport('" + fp + "');", delay));
		}
	},
	"require": function(modname, lazy) { // lazy only matters compile-time
		if (modname.slice(0, 4) == "http") {
			if (!(modname in CT._.extReqs)) {
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
	"onload": function(cb, n) {
		n = n || window;
		if (!n._ct_onload) {
			n._ct_onload = [];
			n.addEventListener('load', function() {
				CT._.triggerOnload(n);
			});
		}
		n._ct_onload.push(cb);
	},
	"dmerge": function() {
		var i, k, v, o = {};
		for (i = arguments.length - 1; i > -1; i--) {
			if (arguments[i]) {
				for (k in arguments[i]) {
					v = arguments[i][k];
					if (typeof v == "object")
						o[k] = Array.isArray(v) ? v.slice() : CT.dmerge(v);
					else
						o[k] = v;
				}
			}
		}
		return o;
	},
	"merge": function() { // properties on earlier objects trump those on later ones
		var i, k, o = {};
		for (i = arguments.length - 1; i > -1; i--)
			if (arguments[i])
				for (k in arguments[i])
					o[k] = arguments[i][k];
		return o;
	},
	"bind": function(ctx, obj) { // recursive bind
		for (var p in obj) {
			if (typeof obj[p] == "function")
				obj[p] = obj[p].bind(ctx);
			else if (typeof obj[p] == "object")
				CT.bind(ctx, obj[p]);
		}
	},
	"Class": function(obj, parent) {
		obj.fullInit = function() {
			if (parent)
				parent.prototype.fullInit.apply(this, arguments);
			if (obj.init)
				obj.init.apply(this, arguments);
		};
		var c = function() {
			var instance = CT.dmerge(c.prototype);
			CT.bind(instance, instance);
			if (!instance.CLASSNAME) {
				instance.CLASSNAME = "CT Class";
				CT.log("Class missing CLASSNAME property -- falling back to 'CT Class'");
			}
			if (!instance.log)
				instance.log = CT.log.getLogger(instance.CLASSNAME);
			obj.fullInit.apply(instance, arguments);
			return instance;
		};
		c.prototype = CT.merge(obj, parent && parent.prototype);
		return c;
	}
};

CT.info.android = /Android/.test(CT.info.userAgent);
CT.info.iOs = /iPhone|iPad/.test(CT.info.userAgent);
CT.info.mobile = /android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(CT.info.userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(CT.info.userAgent.substr(0,4));
CT.info.isStockAndroid = (CT.info.userAgent.indexOf("Mozilla/5.0") != -1)
	&& (CT.info.userAgent.indexOf("Android ") != -1)
	&& (CT.info.userAgent.indexOf("AppleWebKit") != -1)
	&& (CT.info.userAgent.indexOf("Chrome") == -1);
CT.info.isMac = /Macintosh/.test(CT.info.userAgent);

CT.log = function(msg, level) {
	if (CT.log._silent)
		return;
	msg = CT.log._fix(msg);
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
CT.log._fix = function(a) {
	return (typeof(a) == "object") ? JSON.stringify(a) : a;
}
CT.log._silent = false;
CT.log.set = function(bool) {
	CT.log._silent = bool;
};
CT.log._loggerCounts = {};
CT.log.getLogger = function(component) {
	var lc = CT.log._loggerCounts;
	if ( ! (component in lc) )
		lc[component] = 0;
	var signature = component + " {" + lc[component] + "}";
	lc[component] += 1;
	var logger = function() {
		var str_arr = [];
		for (var i = 0; i < logger.arguments.length; i++)
			str_arr.push(CT.log._fix(logger.arguments[i]));
		CT.log("[" + signature + "] " + str_arr.join(" "));
	};
	return logger;
};
CT.log._tcbs = {};
CT.log._timer = CT.log.getLogger("timer");
CT.log.startTimer = function(tname) {
	CT.log._tcbs[tname] = Date.now();
};
CT.log.endTimer = function(tname, msg) {
	var duration = (Date.now() - CT.log._tcbs[tname]) / 1000;
	CT.log._timer("Completed in", duration, "seconds:", tname, msg);
};

// shims (fallbacks for old browsers)
if (!window.JSON)
	CT.require("CT.lib.shims.JSON", true);
if (!window.sessionStorage)
	CT.require("CT.lib.shims.sessionStorage", true);
if (!document.createElement("div").classList)
	CT.require("CT.lib.shims.classList", true);
if (!window.requestAnimationFrame)
	CT.require("CT.lib.shims.requestAnimationFrame", true);
if (!Object.values)
	CT.require("CT.lib.shims.ObjectValues", true);
if (!window.addEventListener)
	window.addEventListener = window.attachEvent;