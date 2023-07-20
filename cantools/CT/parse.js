/*
This module contains functions for manipulating and processing text. This includes:

### parsing
Mainly, you'll just want to call CT.parse.process(c, simple, customArg).

#### It returns the processed string and supports 3 positional arguments:
    - c (string)
      - the text to process
    - simple (bool)
      - if true, uses simple link wrapping
      - else (default), embeds images and invokes custom processor (if any)
    - customArg (anything)
      - passed to custom link processor, if any (for indicating some mode, for instance)

#### Furthermore:
    - normalizes whitespace
    - formats and embeds links for phone numbers
    - generates mailto links as necessary
    - processes remaining links via url2link() or processLink() (switching on simple)

### link processing
This is done through CT.parse.processLink(url, customArg).

#### It supports two arguments:
    - url: url to parse
    - customArg: passed to custom processor, for instance, for disabling embedded video

#### Furthermore:
    - embeds images
    - linkifies other links
    - adds 0-width whitespace characters to line-break url strings as necessary
      - via CT.parse.breakurl(url)
    - supports custom link processing callbacks
      - via CT.parse.setLinkProcessor(cb)

### input constraints/validation
	CT.parse.validEmail(s): returns bool
	CT.parse.validPassword(s): returns bool
	CT.parse.numOnly(n, allowDot, noNeg): returns n
	 - turn 'n' input into a field that only allows numbers
	 - allowDot and noNeg toggle decimals and negative #s

### strippers, formatters, converters, sanitization
Various functions for deriving different types of information, such as
phone numbers and zip codes, from text; reformatting recognizable strings
and generating links (as in the case of phone numbers); case-modding,
soft-truncating, and removing script blocks from text; and otherwise messing
with strings. Also, CT.parse.timeStamp(datetime) goes a long way toward
making timestamps meaningful to humans.
*/

CT.parse = {
	"_linkProcessor": null,
	"_NUMS": '0123456789',
	"imgTypes": [
	    ".png", ".PNG",
	    ".jpg", ".JPG",
	    ".gif", ".GIF",
	    ".img", ".IMG",
	    ".bmp", ".BMP",
	    "jpeg", "JPEG",
	    "webp", "WEBP",
	    "avif", "AVIF"
	],

	// link handlers
	"setLinkProcessor": function(cb) {
		CT.parse._linkProcessor = cb;
	},
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
	"processLink": function(url, customArg) {
	    var itz = CT.parse.imgTypes,
	    	ext = url.slice(-4);
	    if (itz.indexOf(ext) != -1) // first pass (fast)
	        return '<img src=' + url + '>';
	    for (var i = 0; i < itz.length; i++) { // second pass
	    	if (url.indexOf(itz[i] + "?") != -1)
		        return '<img src=' + url + '>';
	    }
	    return CT.parse._linkProcessor
	    	&& CT.parse._linkProcessor(url, customArg)
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
	"validIPv4": function(s) {
		var parts = s.split("."),
			rejoined = parts.map(p => parseInt(p)).join(".");
		return parts.length == 4 && s == rejoined;
	},

	// input filter
	"numOnly": function(n, allowDot, noNeg) {
	    n.onkeyup = function() {
	        var i, c, v = "", hasdot = false;
	        for (i = 0; i < n.value.length; i++) {
	            c = n.value.charAt(i);
	            if (allowDot && !hasdot && c == ".")
	                hasdot = true;
	            else if (!(!noNeg && !i && c == "-") && (CT.parse._NUMS.indexOf(c) == -1))
	                continue;
	            v += c;
	        }
	        n.value = v;
	    };
	    return n;
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
	"month2num": function(month) {
	    return CT.dom._monthnames.indexOf(month) + 1;
	},

	// strippers, formatters, sanitization
	"extractImage": function(s) {
		var i, j, token, ytparts, itz = CT.parse.imgTypes,
			tokens = s.replace(/\n/g, " ").replace(/</g, " <").replace(/>/g, "> ").replace(/&amp;/g, "&").split(" ");
		for (i = 0; i < tokens.length; i++) {
			token = tokens[i];
			if (token.startsWith("http")) {
				if (itz.indexOf(token.slice(-4)) != -1)
					return token; // first pass (quick)
				for (j = 0; j < itz.length; j++) { // second pass
					if (token.indexOf(itz[j] + "?") != -1)
						return token;
				}
				ytparts = token.split("?v=");
				if (ytparts.length == 2)
					return 'https://img.youtube.com/vi/' + ytparts[1] + '/0.jpg';
			}
		}
	},
	"stripLast": function(w) {
	    var lcs = "",
	        lc = w.charAt(w.length - 1);
	    while (['.', ',', ':', ';', ')', ']', '!'].indexOf(lc) != -1) {
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
	"shortened": function(txt, len, wlen, nolink) {
		if (nolink)
			txt = txt.replace(/\n/g, " ").split(" http")[0];
		var orig = txt;
		len = len || 500;
		if (wlen)
			txt = txt.split(" ").slice(0, wlen).join(" ");
		if (txt.length > len)
			txt = txt.slice(0, len);
		if (txt != orig)
			txt += " ...";
		return txt;
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
	"niceNum": function(n) {
		if (n < 999) return n;
		var str = n.toString(),
			pos = str.length - 3;
		while (pos > 0) {
			str = str.slice(0, pos) + "," + str.slice(pos);
			pos -= 3;
		}
		return str;
	},

	// timestamps
	"_countdown": function(secs) {
		var mins, hours, days, parts = [];
		mins = ~~(secs / 60);
		secs -= mins * 60;
		hours = ~~(mins / 60);
		mins -= hours * 60;
		days = ~~(hours / 24);
		hours -= days * 24;
		if (days)
			parts.push(days + " days");
		if (hours)
			parts.push(hours + " hours");
		if (mins)
			parts.push(mins + " minutes");
		if (secs)
			parts.push(~~secs + " seconds");
		return parts.join(", ");
	},
	"countdown": function(secs, cb) {
		var n = CT.dom.span(CT.parse._countdown(secs));
		setInterval(function() {
			secs -= 1;
			CT.dom.setContent(n, CT.parse._countdown(secs));
			!secs && cb && cb();
		}, 1000);
		return n;
	},
	"date2string": function(d, noletters, notime) {
		d = d || new Date();
		var month = d.getMonth() + 1, date = d.getDate();
		if (month < 10)
			month = '0' + month;
		if (date < 10)
			date = '0' + date;
		var ds = d.getFullYear() + '-' + month + '-' + date;
		if (notime) return ds;
		var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
		if (h < 10)
			h = '0' + h;
		if (m < 10)
			m = '0' + m;
		if (s < 10)
			s = '0' + s;
		return ds + (noletters ? ' ' : 'T') + h + ':' + m + ':' + s + (noletters ? '' : 'Z');
	},
	"string2date": function(s) {
		var year, month, rest, day, hour, minute, second;
		[year, month, rest] = s.split("-");
		day = rest.slice(0, 2);
		if (rest.indexOf(":") != -1) {
			[hour, minute, second] = rest.slice(3).split(":");
			second = parseInt(second); // potential trailing Z
		}
		return new Date(year, parseInt(month) - 1, day, hour, minute, second);
	},
	"_stampString": function(diff, name) {
	    if (!diff) return false;
	    return diff + " " + name + (diff == 1 ? "" : "s");
	},
	"_ts_server_offset": 0,
	"set_ts_server_offset": function(offset) {
		CT.log("[DEPRECATION WARNING] CT.parse.set_ts_server_offset() is deprecated. Just stop using it!");
		CT.parse._ts_server_offset = offset;
	},
	"timeStamp": function(datetime) {
	    var now = new Date(),
	    	then = new Date(datetime.replace('T', ' ').replace(/-/g, '/') + "Z"),
	        secs = (now - then) / 1000,
	        mins = ~~(secs / 60),
	        hours = ~~(mins / 60),
	        days = ~~(hours / 24);
	    return (CT.parse._stampString(days, "day") || CT.parse._stampString(hours, "hour")
	        || CT.parse._stampString(mins, "min") || "moments") + " ago";
	},

	"enableVideo": function() {
		CT.parse.setLinkProcessor(CT.parse.vid);
	},
	"vid": function(url) {
		var vdata = CT.video.videoData(url);
		return vdata ? CT.video.full(vdata) : url;
	},

	// parser
	"process": function(c, simple, customArg) {
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
	        if (!prev || (isNaN(prev) && prev != ">" && prev != ":" && cmodded.slice(i - 2, i) != "+1"))
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
	            	: CT.parse.processLink)(w, customArg) + lc + endCap;
	        }
	    }
	    return clist.join(" ").replace(/ <\//g, "</");
	}
};