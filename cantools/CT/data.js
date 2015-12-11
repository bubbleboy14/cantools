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

	// cache
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
	"uniquify": function(items, exceptions) {
	    exceptions = exceptions || [];
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
	"require": function(key, cb, plist, getpath, getparams) {
		CT.data.requirePrep(key);
	    if (CT.data.itemReady(key, plist))
	        cb(CT.data.get(key));
	    else {
	    	getparams = getparams || {"gtype": "user", "chat": 1};
	    	getparams.uid = key;
	        CT.net.post(getpath || "/get", getparams,
	            "error retrieving data", function(rawdata) {
	                CT.data.add(rawdata);
	                cb(CT.data.get(key));
	            });
	    }
	},
	"requireAll": function(keys, cb, uid, plist, getpath, getparams) {
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
	    	getparams.uids = needed;
	        CT.net.post("/get", getparams,
	            "error retrieving data", function(rawdata) {
	            	CT.data.addSet(rawdata);
	                cb(keys);
	            });
	    }
	}
};