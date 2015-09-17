CT.data = {
	map: {},
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
	            if (!sameList(dnew[k], dold[k]))
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
	}
};