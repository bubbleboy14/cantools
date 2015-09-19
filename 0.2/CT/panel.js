CT.panel = {
	"lastClicked": {},
	"swap": function(key, trysidepanel, keystring, noitem) {
	    keystring = keystring || "sb";
	    key = key.replace(/ /g, "");
	    var items = document.getElementsByClassName(keystring+"panel");
	    for (var i = 0; i < items.length; i++)
	        items[i].className = keystring+"panel hidden";
	    document.getElementById(keystring+"panel"+key).className = keystring+"panel";
	    if (trysidepanel) {
	        var n = document.getElementById(keystring+"panel"+key+"Side");
	        if (n) n.className = keystring+"panel";
	        var n2 = document.getElementById(keystring+"panel"+key+"Side2");
	        if (n2) n2.className = keystring+"panel";
	    }
	    if (!noitem)
	        CT.panel.select(key, keystring);
	},
	"select": function(key, keystring) {
	    keystring = keystring || "sb";
	    var items = document.getElementsByClassName(keystring+"item");
	    for (var i = 0; i < items.length; i++)
	        items[i].className = items[i].className.replace(" activetab", "");
	    if (key) {
	        document.getElementById(keystring+"item"+key).className += " activetab";
	        CT.panel.lastClicked[keystring] = key;
	    }
	    CT.mobile.mobileSnap();
	},
	"new": function(key, trysidepanel, keystring, itemnode, panelnode, nospace, icon, cb) {
	    nospace = nospace || key.replace(/ /g, "");
	    keystring = keystring || "sb";
	    if (!document.getElementById(keystring+"panel"+nospace)) {
	        var n = CT.dom.node("", "div", keystring+"panel", keystring+"panel"+nospace);
	        n.appendChild(CT.dom.node(key, "div", CT.style.panel.title));
	        n.appendChild(CT.dom.node("", "div", "", keystring+"content"+nospace));
	        (panelnode || document.getElementById(keystring+"panels")).appendChild(n);
	    }
	    var i = document.getElementById(keystring+"item"+nospace);
	    if (i)
	        i.style.display = "block";
	    else {
	        itemnode = itemnode || document.getElementById(keystring+"items");
	        var clickfunc = function() {
	            CT.panel.swap(nospace, trysidepanel, keystring);
	            cb && cb();
	         };
	        if (icon)
	            itemnode.appendChild(CT.dom.wrapped(CT.dom.img(icon,
	                null, clickfunc), "div", "lfloat shiftleft"));
	        itemnode.appendChild(CT.dom.wrapped(CT.dom.link(key, clickfunc),
	            "div", keystring+"item", keystring+"item"+nospace));
	        if (icon)
	            itemnode.appendChild(CT.dom.node("", "div", "clearnode"));
	    }
	},
	"remove": function(key, keystring) {
	    var nospace = key.replace(/ /g, "");
	    var p = document.getElementById(keystring+"panel"+nospace);
	    if (p) p.style.display = "none";
	    var l = document.getElementById(keystring+"item"+nospace);
	    if (l) l.style.display = "none";
	},
	"load": function(pnames, trysidepanel, keystring, itemnode, panelnode, nospaces, icons, noclear, stillswap, cbs) {
	    keystring = keystring || "sb";
	    if (!noclear)
	        (itemnode || document.getElementById(keystring+"items")).innerHTML = "";
	    for (var i = 0; i < pnames.length; i++)
	        CT.panel.new(pnames[i], trysidepanel, keystring, itemnode,
	            panelnode, nospaces && nospaces[i] || null,
	            icons && icons[i] || null, cbs && cbs[i] || null);
	    if (stillswap || (!itemnode && !noclear))
	        CT.panel.swap(pnames[0], trysidepanel, keystring);
	}
};