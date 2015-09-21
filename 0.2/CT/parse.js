// time stuff
// Date prototype stuff from:
// http://stackoverflow.com/questions/11887934/check-if-daylight-saving-time-is-in-effect-and-if-it-is-for-how-many-hours
Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};
Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};
var SERVER_OFFSET = (new Date()).dst() ? 7 : 8; // i think ;)

CT.parse = {
	"linkProcessor": null,
	"_NUMS": '0123456789',
	"imgTypes": [
	    ".gif", ".GIF",
	    ".png", ".PNG",
	    ".jpg", ".JPG",
	    "jpeg", "JPEG"
	],

	// link handlers
	"breakurl": function(url) {
	    return url.replace(/&/g, "&&#8203;").replace(/\//g, "/&#8203;").replace(/_/g, "_&#8203;");
	},
	"url2link": function(rurl, rname) {
	    var furl = rurl;
	    if (furl.slice(0,7) == "http://")
	        rurl = rurl.slice(7);
	    else if (furl.slice(0,8) == "https://")
	        rurl = rurl.slice(8);
	    else
	        furl = "http://" + furl;
	    return '<a target="_blank" href=' + furl + '>' + (rname || CT.parse.breakurl(rurl)) + "</a>";
	},
	"processLink": function(url, novid) {
	    var ext = url.slice(-4);
	    if (CT.parse.imgTypes.indexOf(ext) != -1)
	        return '<img src=' + url + '>';
	    return CT.parse.linkProcessor
	    	&& CT.parse.linkProcessor(url, novid)
	    	|| CT.parse.url2link(url);
	},

	// validators
	"validEmail": function(s) {
	    var atChar = s.indexOf('@', 1);
	    var dotChar = s.indexOf('.', atChar);
	    if (atChar == -1 || dotChar == -1 ||
	        dotChar == s.length - 1 || atChar + 2 > dotChar)
	            return false;
	    return true;
	},
	"validPassword": function(s) {
	    return s && s.length > 5;
	},

	// generic conversions
	"capitalize": function(word) {
	    return word.slice(0,1).toUpperCase() + word.slice(1);
	},
	"toCaps": function(lowers) {
	    var uppers = [];
	    for (var i = 0; i < lowers.length; i++)
	        uppers.push(CT.parse.capitalize(lowers[i]));
	    return uppers;
	},
	"key2title": function(k) {
	    return CT.parse.toCaps(k.split("_")).join(" ");
	},
	"words2title": function(k) {
	    return CT.parse.toCaps(k.split(" ")).join(" ");
	},
	"keys2titles": function(lowers) {
	    var uppers = [];
	    for (var i = 0; i < lowers.length; i++)
	        uppers.push(CT.parse.key2title(lowers[i]));
	    return uppers;
	},

	// strippers, formatters, sanitization
	"stripLast": function(w) {
	    var lcs = "",
	        lc = w.charAt(w.length - 1);
	    while (['.', ',', ':', ';', ')', ']'].indexOf(lc) != -1) {
	        w = w.slice(0, w.length - 1);
	        lcs = lc + lcs;
	        lc = w.charAt(w.length - 1);
	    }
	    return [lcs, w];
	},
	"stripToNums": function(s) {
	    s = s || "";
	    var newStr = '';
	    for (var i = 0; i < s.length; i++) {
	        if (CT.parse._NUMS.indexOf(s.charAt(i)) != -1)
	            newStr += s.charAt(i);
	    }
	    return newStr;
	},
	"stripToZip": function(s) {
	    var newStr = CT.parse.stripToNums(s);
	    if (newStr.length < 5)
	        return "";
	    return newStr.slice(0, 5);
	},
	"stripToPhone": function(s) {
	    var newStr = CT.parse.stripToNums(s);
	    if (newStr.length < 10)
	        return "";
	    return newStr.slice(0,10);
	},
	"formatPhone": function(s) {
	    var pn = CT.parse.stripToPhone(s);
	    return pn.slice(0, 3) + "-" + pn.slice(3, 6) + "-" + pn.slice(6);
	},
	"formatPhoneLink": function(s) {
	    var pn = CT.parse.formatPhone(s);
	    return "<a href='tel:+1" + pn + "'>" + pn + "</a>";
	},
	"shortened": function(txt, len) {
	    len = len || 500;
	    if (txt.length < len) {
	        return txt;
	    }
	    return txt.slice(0, len) + ' ...';
	},
	"sanitize": function(b) {
	    var sstart = "<scr" + "ipt";
	    var send = "</sc" + "ript>";
	    var ssi = b.indexOf(sstart);
	    while (ssi != -1) {
	        var sei = b.indexOf(send, ssi);
	        if (sei == -1)
	            sei = b.length;
	        b = b.slice(0, ssi) + b.slice(sei+9, b.length);
	        ssi = b.indexOf(sstart);
	    }
	    // regex from http://www.somacon.com/p355.php
	    return b.replace(/^\s+|\s+$/g,"");
	},

	// relative timestamps
	"_stampString": function(diff, name) {
	    if (!diff) return false;
	    return diff + " " + name + (diff == 1 ? "" : "s");
	},
	"timeStamp": function(datetime) {
	    var now = new Date();
	    now.setHours(now.getHours() + (now.getTimezoneOffset() / 60) - SERVER_OFFSET);
	    var then = new Date(datetime.replace('T', ' ').replace(/-/g, '/')),
	        secs = (now - then) / 1000,
	        mins = ~~(secs / 60),
	        hours = ~~(mins / 60),
	        days = ~~(hours / 24);
	    return (CT.parse._stampString(days, "day") || CT.parse._stampString(hours, "hour")
	        || CT.parse._stampString(mins, "min") || "moments") + " ago";
	},

	// parser
	"process": function(c, simple, novid) {
	    if (!c) return "";

	    // whitespace and tags
	    var cmodded = c.replace(new RegExp(String.fromCharCode(10), 'g'), ' ')
	        .replace(new RegExp(String.fromCharCode(13), 'g'), ' ')
	        .replace(/</g, " <").replace(/>/g, "> ")
	        .replace(/&nbsp;/g, " ").replace(/  /g, ' ');

	    // phone numbers
	    var phoneMatches = cmodded.match(/\d{3}-\d{3}-\d{4}/g);
	    if (phoneMatches) phoneMatches.forEach(function(matchstr) {
	        var i = cmodded.indexOf(matchstr);
	        var prev = cmodded.charAt(i - 1);
	        if (prev != ">" && prev != ":" && cmodded.slice(i - 2, i) != "+1")
	            cmodded = cmodded.replace(matchstr,
	            	CT.parse.formatPhoneLink(matchstr));
	    });

	    // tokenize
	    var clist = cmodded.trim().split(" ");

	    // emails and links
	    for (var i = 0; i < clist.length; i++) {
	        var w = clist[i];
	        if (w.indexOf(":") == -1 && CT.parse.validEmail(w)) {
	            clist[i] = "<a href='mailto:" + w + "'>" + w + "</a>";
	            continue;
	        }
	        var fci = w.indexOf("https://");
	        if (fci == -1)
	            fci = w.indexOf("http://");
	        if (fci != -1 && w[fci-1] != '"') {
	            var frontCap = w.slice(0, fci);
	            w = w.slice(fci);
	            var endCap = "";
	            var eci = w.indexOf('<');
	            if (eci != -1) {
	                endCap = w.slice(eci);
	                w = w.slice(0, eci);
	            }
	            var sl = CT.parse.stripLast(w),
	                lc = sl[0],
	                w = sl[1];
	            clist[i] = frontCap + (simple ? CT.parse.url2link
	            	: CT.parse.processLink)(w, novid) + lc + endCap;
	        }
	    }
	    return clist.join(" ");
	}
};