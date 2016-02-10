CT.panel = {
	"lastClicked": {},
	"swap": function(key, trysidepanel, keystring, noitem) {
	    keystring = keystring || "sb";
	    key = key.replace(/ /g, "");
	    var items = CT.dom.class(keystring + "panel");
	    for (var i = 0; i < items.length; i++)
	        items[i].className = keystring + "panel hidden";
	    CT.dom.id(keystring +  "panel" + key).className = keystring + "panel";
	    if (trysidepanel) {
	        var n = CT.dom.id(keystring + "panel" + key + "Side");
	        if (n) n.className = keystring+"panel";
	        var n2 = CT.dom.id(keystring + "panel" + key + "Side2");
	        if (n2) n2.className = keystring + "panel";
	    }
	    if (!noitem)
	        CT.panel.select(key, keystring);
	},
	"select": function(key, keystring) {
	    keystring = keystring || "sb";
	    var items = CT.dom.class(keystring + "item");
	    for (var i = 0; i < items.length; i++)
	        items[i].className = items[i].className.replace(" activetab", "");
	    if (key) {
	        CT.dom.id(keystring + "item" + key, true).className += " activetab";
	        CT.panel.lastClicked[keystring] = key;
	    }
	    CT.mobile && CT.mobile.mobileSnap();
	},
	"selectLister": function(newkey, oldkey, newhtml) {
	    if (oldkey)
	        CT.dom.id("ll" + oldkey).className = "pointer";
	    var newnode = CT.dom.id("ll" + newkey);
	    newnode.className = "pointer activetab";
	    if (newhtml)
	        newnode.firstChild.innerHTML = newhtml;
	    CT.mobile && CT.mobile.mobileSnap();
	},
	"add": function(key, trysidepanel, keystring, itemnode, panelnode, nospace, icon, cb) {
	    nospace = nospace || key.replace(/ /g, "");
	    keystring = keystring || "sb";
	    if (!CT.dom.id(keystring + "panel" + nospace)) {
	        var n = CT.dom.node("", "div", keystring + "panel", keystring + "panel" + nospace);
	        n.appendChild(CT.dom.node(key, "div", CT.style.panel.title));
	        n.appendChild(CT.dom.node("", "div", "", keystring+"content"+nospace));
	        (panelnode || CT.dom.id(keystring+"panels")).appendChild(n);
	    }
	    var i = CT.dom.id(keystring+"item"+nospace);
	    if (i)
	        i.style.display = "block";
	    else {
	        itemnode = itemnode || CT.dom.id(keystring+"items");
	        var clickfunc = function() {
	            CT.panel.swap(nospace, trysidepanel, keystring);
	            cb && cb();
	        };
	        if (icon)
	            itemnode.appendChild(CT.dom.node(CT.dom.img(icon,
	                null, clickfunc), "div", "lfloat shiftleft"));
	        itemnode.appendChild(CT.dom.node(CT.dom.link(key, clickfunc),
	            "div", keystring + "item pointer", keystring + "item" + nospace));
	        if (icon)
	            itemnode.appendChild(CT.dom.node("", "div", "clearnode"));
	    }
	},
	"remove": function(key, keystring) {
	    var nospace = key.replace(/ /g, "");
	    var p = CT.dom.id(keystring+"panel"+nospace);
	    if (p) p.style.display = "none";
	    var l = CT.dom.id(keystring+"item"+nospace);
	    if (l) l.style.display = "none";
	},
	"load": function(pnames, trysidepanel, keystring, itemnode, panelnode, nospaces, icons, noclear, stillswap, cbs) {
	    keystring = keystring || "sb";
	    if (!noclear)
	        (itemnode || CT.dom.id(keystring+"items")).innerHTML = "";
	    for (var i = 0; i < pnames.length; i++)
	        CT.panel.add(pnames[i], trysidepanel, keystring, itemnode,
	            panelnode, nospaces && nospaces[i] || null,
	            icons && icons[i] || null, cbs && cbs[i] || null);
	    if (stillswap || (!itemnode && !noclear))
	        CT.panel.swap(pnames[0], trysidepanel, keystring);
	},
	"simple": function(pnames, keystring, itemnode, panelnode, cbs) {
		CT.panel.load(pnames, null, keystring, itemnode, panelnode, null, null, null, true, cbs);
	},
	"pager": function(getContent, request, limit, colClass, dataClass) {
		var content = CT.dom.node(null, null, dataClass),
			sideBar = CT.dom.node(),
			pager = new CT.Pager(function(data) {
				var dnames = [],
					keystring = "p" + pager.id;
				data.forEach(function(d) {
					d._label = (d.label || d.key);
					d._labelns = d._label.replace(/ /g, "");
					dnames.push(d._label);
				});
				CT.panel.simple(dnames, keystring, sideBar, content);
				data.forEach(function(d) {
					CT.dom.id(keystring + "content" + d._labelns,
						true).appendChild(getContent(d));
				});
				return sideBar;
			}, request, limit, colClass),
			n = CT.dom.node([pager.node, content]);
		n.pager = pager;
		return n;
	},
	"alternatebg": function(n, watchforicons, resetonbreak) {
	    n = n || document.getElementById("sbitems");
	    if (watchforicons) {
	        var switcher = 1;
	        for (var i = 0; i < n.childNodes.length; i++) {
	            var c = n.childNodes[i];
	            if (c.className.indexOf("lfloat") == -1 && c.className.indexOf("clearnode") == -1) {
	                if (resetonbreak && c.nodeName == "BR") {
	                    switcher = 1;
	                    continue;
	                }
	                if (switcher == 1)
	                    c.style.background = "#899fb0";
	                switcher *= -1;
	            }
	        }
	    }
	    else {
	        for (var i = 0; i < n.childNodes.length; i+=2)
	            n.childNodes[i].style.background = "#899fb0";
	    }
	}
};