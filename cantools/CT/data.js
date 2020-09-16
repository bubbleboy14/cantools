/*
This module contains functions for:

	- structure comparison
	- array manipulation
	- object caching
	- data acquisition
*/

CT.data = {
	map: {},

	// data comparison
	"sameList": function(list1, list2) {
		if (list1.length != list2.length)
			return false;
		for (var i = 0; i < list1.length; i++) {
			if (list1[i] != list2[i])
				return false;
		}
		return true;
	},
	"copyList": function(oldlist) {
		var newlist = [];
		for (var i = 0; i < oldlist.length; i++)
			newlist.push(oldlist[i]);
		return newlist;
	},
	"diff": function(dold, dnew, required, compdicts, submap, complists) {
		var ddiff = required || {};
		compdicts = compdicts || [];
		complists = complists || [];
		submap = submap || {};
		for (var k in dnew) {
			if (compdicts.indexOf(k) != -1) {
				for (var j in dnew[k]) {
					if (dnew[k][j] != dold[k][j]) {
						ddiff[k] = dnew[k];
						break;
					}
				}
			}
			else if (complists.indexOf(k) != -1) {
				if (!CT.data.sameList(dnew[k], dold[k]))
					ddiff[k] = dnew[k];
			}
			else if (k in submap) {
				if (dnew[k] != dold[k][submap[k]])
					ddiff[k] = dnew[k];
			}
			else if (dnew[k] != dold[k])
				ddiff[k] = dnew[k];
		}
		return ddiff;
	},

	// array stuff
	"append": function(arr, el) {
		if (arr.indexOf(el) == -1)
			arr.push(el);
	},
	"remove": function(arr, el) {
		var elindex = arr.indexOf(el);
		if (elindex != -1)
			return arr.splice(elindex, 1);
	},
	"sum": function(arr) {
		return arr.length ? arr.reduce(function(a, b) {
			if (Array.isArray(a)) {
				return a.map(function(v, i) {
					return v + b[i];
				});
			}
			return a + b;
		}) : arr;
	},
	"alpha": function(arr, prop) {
		return arr.sort(function(a, b) {
			if (prop) {
				a = a[prop];
				b = b[prop];
			}
			return (a < b) ? -1 : (a > b) ? 1 : 0;
		});
	},

	// cache
	"has": function(key) {
		return !!CT.data.map[key];
	},
	"get": function(key) {
		return CT.data.map[key];
	},
	"add": function(d) {
		if (CT.data.map[d.key]) {
			for (var k in d)
				CT.data.map[d.key][k] = d[k];
		}
		else
			CT.data.map[d.key] = d;
	},
	"addSet": function(dlist) {
		for (var i = 0; i < dlist.length; i++)
			CT.data.add(dlist[i]);
	},
	"getSet": function(klist) {
		return klist.map(CT.data.get);
	},
	"uniquify": function(items, exceptions) {
		exceptions = exceptions || [];
		items = CT.data.copyList(items); // preserve original list!!
		items.sort();
		var newitems = [];
		var latestitem = "";
		for (var i = 0; i < items.length; i++) {
			if (items[i] != latestitem && exceptions.indexOf(items[i]) == -1) {
				latestitem = items[i];
				newitems.push(latestitem);
			}
		}
		return newitems;
	},

	// cheap trick
	"copy": function(str) {
		var f = CT.dom.field(null, str, "transparent");
		document.body.appendChild(f);
		f.select();
		if (document.execCommand('copy')) {
			alert("Link saved to clipboard. Great!");
			f.remove();
		} else {
			f.className = "";
			CT.modal.modal(CT.dom.div([
				"Ctr-C to Copy URL", f
			], "centered"));
			setTimeout(function() { // wait a tick for modal
				f.select();
			});
		}
	},

	// random stuff
	"numstr": function(len) {
		var s = "", chunk;
		while (len) {
			chunk = Math.min(len, 16);
			s += "" + CT.data.random(Math.pow(10, chunk));
			len -= chunk;
		}
		return s;
	},
	"random": function(max) {
		return Math.floor(Math.random() * max);
	},
	"choice": function(arr) {
		return arr[CT.data.random(arr.length)];
	},

	// data acquisition functions -- require backend integration
	"checkAndDo": function(keys, cb, nlcb, eb, req, getpath, getparams) {
		var needed = [];
		keys = CT.data.uniquify(keys);
		for (var i = 0; i < keys.length; i++) {
			if (CT.data.map[keys[i]] == null || req && CT.data.map[keys[i]][req] == null)
				needed.push(keys[i]);
		}
		if (needed.length == 0)
			return cb();
		getparams = getparams || {"gtype": "data"};
		getparams.keys = needed;
		CT.net.post(getpath || "/get", getparams,
		"error retrieving data", function(rawdata) {
			CT.data.addSet(rawdata);
			if (nlcb) nlcb(needed);
			cb();
		}, eb);
	},
	"requirePrep": function() {}, // override!
	"itemReady": function(key, plist) {
		var isready = key in CT.data.map;
		plist && plist.forEach(function(p) {
			isready = isready && p in CT.data.map[key];
		});
		return isready;
	},
	"require": function(key, cb, plist, getpath, getparams, getprop) {
		CT.data.requirePrep(key);
		if (CT.data.itemReady(key, plist))
			cb(CT.data.get(key));
		else {
			getparams = getparams || {"gtype": "user", "chat": 1};
			getparams[getprop || "uid"] = key;
			CT.net.post(getpath || "/get", getparams,
				"error retrieving data", function(rawdata) {
					CT.data.add(rawdata);
					cb(CT.data.get(key));
				});
		}
	},
	"requireAll": function(keys, cb, uid, plist, getpath, getparams, getprop) {
		keys.forEach(CT.data.requirePrep);
		var needed = [];
		for (var i = 0; i < keys.length; i++) {
			if (!CT.data.itemReady(keys[i], plist))
				needed.push(keys[i]);
		}
		if (needed.length == 0)
			cb(keys);
		else {
			getparams = getparams || {"gtype": "user", "chat": 1};
			getparams[getprop || "uids"] = needed;
			CT.net.post(getpath || "/get", getparams,
				"error retrieving data", function(rawdata) {
					CT.data.addSet(rawdata);
					cb(keys);
				});
		}
	}
};