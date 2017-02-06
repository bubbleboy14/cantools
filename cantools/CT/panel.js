/*
This module contains functions for generating lists of items that,
when clicked, show corresponding content or trigger corresponding
logic. Here are three examples.

### CT.panel.simple(pnames, keystring, itemnode, panelnode, cbs)
This function wraps CT.panel.load(), supporting a subset of load()'s
options (the simple ones). It supports the following args, of which
only the first is required:

    - pnames (string array): short for 'panel names'
    - keystring (string, default: 'sb'): identifier for collections of content/lister nodes
    - itemnode (node, default: CT.dom.id(keystring + "items")): parent node for lister items
    - panelnode (node, default: CT.dom.id(keystring + "panels")): parent node for content panels
    - cbs (function array, optional): callbacks to invoke on lister item click post- panel swap

### CT.panel.pager(getContent, request, limit, colClass, dataClass, ks)
This function generates and returns a node containing a
(CT.Pager-backed) paging lister node and a corresponding content panel.

    - getContent (function): combined with CT.panel.simple() in pager's renderCb
    - request (function): pager's requestCb
    - limit (number, default: 20): pager's limit (chunk size)
    - colClass (string, optional): class of generated pager (list selector) node
    - dataClass (string, optional): class of generated data (content panel) node
    - ks (string, default: "p" + CT.Pager._id): keystring of data and list nodes

### CT.panel.triggerList(data, cb, node)
This function fills the 'node' node with a list of clickable items, each of
which triggers cb(d), where d is the corresponding object in the 'data' array.

    - data (object array): data set used to generate list
      - for d in data: link content equals d.label || d.title
    - cb (function): the callback to invoke when an item is clicked
    - node (node): the list parent node
*/

CT.panel = {
	"view1": {}, // [keystring + key]
	"lastClicked": {},
	"accordion": function(data, triggerCb, activeClass, content, condition, notick, rmbutton, ricon, noactive) {
		var n = CT.dom.node(null, null, "tabbed", "ac" + data.name);
		n.add = function(tdata, makeFirst, addAlpha) {
			var i, inserted, t = CT.panel.trigger(tdata, triggerCb,
				activeClass, content, condition, rmbutton, ricon, noactive);
			if (makeFirst)
				n.insertBefore(t, n.firstChild);
			else if (addAlpha) {
				for (i = 0; i < n.childNodes.length; i++) {
					if (n.childNodes[i].data.name > t.data.name) {
						n.insertBefore(t, n.childNodes[i]);
						inserted = true;
						break;
					}
				}
				if (!inserted)
					n.appendChild(t);
			} else
				n.appendChild(t);
			return t;
		};
		n._drops = [];
		n.expand = function() {
			n._drops.forEach(function(d) {
				d.expand();
			});
		};
		n.retract = function() {
			n._drops.forEach(function(d) {
				d.retract();
			});
		};
		data.forEach(function(d) {
			if (d.children) {
				var tick = CT.dom.node(">", "div", "inline-block" + (notick && " hidden" || "")),
					t = CT.dom.node(),
					tline = [tick, CT.dom.link(content ? content(d) : d.name, null, null, "inline-block pointer acheader")];
				if (ricon)
					tline.unshift(CT.dom.node(ricon(d), "div", "right rpaddedsmall"));
				CT.dom.setContent(t, tline);
				t.content = CT.panel.accordion(d.children, triggerCb,
					activeClass, content, condition, notick, rmbutton, ricon, noactive);
				n.appendChild(t);
				n._drops.push(new CT.Drop({
					anchor: t,
					parent: n,
					relative: true,
					constrained: false,
					setNodeClick: false,
					content: t.content,
					onShow: function() {
						CT.trans.rotate(tick, { duration: 100, degrees: 90 });
					},
					onHide: function() {
						CT.trans.rotate(tick, { duration: 100, degrees: 0 });
					}
				}));
			} else
				n.add(d);
		});
		return n;
	},
	"trigger": function(data, cb, activeClass, content, condition, rmbutton, ricon, noactive) {
		var label = data.label || data.title || data.name || data.topic || data,
			key = data.key || label,
			n = CT.dom.node(null, "div", "tlitem", key && ("tl" + key.replace(/ /g, "")));
		activeClass = activeClass || "activetab";
		n.data = data;
		data.node = n;
		n.select = function() {
			!noactive && CT.dom.each(n.parentNode, function(c) {
				if (c == n)
					c.classList.add(activeClass);
				else
					c.classList.remove(activeClass);
				c.className = (c == n) ? activeClass : "";
			});
		};
		n.trigger = function() {
			if (condition && !condition()) return;
			n.select();
			cb(data);
		};
		n.remove = function() {
			CT.dom.remove(n);
			n.onRemove && n.onRemove();
		};
		n.nameNode = CT.dom.link(content ? content(data) : label, n.trigger);
		n.rename = function(name) {
			data.label = name;
			n.id = "tl" + name.replace(/ /g, "");
			CT.dom.setContent(n.nameNode, name);
		};
		if (ricon)
			n.appendChild(CT.dom.node(ricon(data), "div", "right rpaddedsmall"));
		if (rmbutton) 
			n.appendChild(CT.dom.link("X", n.remove, null, "right"));
		n.appendChild(n.nameNode);
		return n;
	},
	"triggerList": function(data, cb, node, activeClass, content, condition, rmbutton, ricon, noactive) {
		node = node || CT.dom.node();
		node.postAdd = function(d, trigger) {
			var t = CT.panel.trigger(d, cb, activeClass, content, condition, rmbutton, ricon, noactive);
			node.appendChild(t);
			(trigger === true) && t.trigger();
		};
		node.preAdd = function(d, trigger) {
			var t = CT.panel.trigger(d, cb, activeClass, content, condition, rmbutton, ricon, noactive);
			if (node.childNodes.length)
				node.insertBefore(t, node.firstChild);
			else
				node.appendChild(t);
			trigger && t.trigger();
		};
		data.forEach(node.postAdd);
		return node;
	},
	"swap": function(key, trysidepanel, keystring, noitem) {
	    keystring = keystring || "sb";
	    key = key.replace(/ /g, "");
	    var items = CT.dom.className(keystring + "panel");
	    for (var i = 0; i < items.length; i++)
	        items[i].className = keystring + "panel hidden";
	    CT.dom.id(keystring +  "panel" + key, true).className = keystring + "panel";
	    if (trysidepanel) {
	        var n = CT.dom.id(keystring + "panel" + key + "Side");
	        if (n) n.className = keystring+"panel";
	        var n2 = CT.dom.id(keystring + "panel" + key + "Side2");
	        if (n2) n2.className = keystring + "panel";
	    }
	    if (!noitem)
	        CT.panel.select(key, keystring);
	    var ksk = keystring + key;
	    if (CT.panel.view1[ksk]) {
	    	CT.panel.view1[ksk](key);
	    	delete CT.panel.view1[ksk];
	    }
	},
	"drill": function(keymap) { // keystring: key
		for (var k in keymap)
			CT.panel.swap(keymap[k], false, k);
	},
	"select": function(key, keystring) {
	    keystring = keystring || "sb";
	    var items = CT.dom.className(keystring + "item");
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
	"add": function(key, trysidepanel, keystring, itemnode, panelnode, nospace, icon, cb, condition, view1) {
	    nospace = nospace || key.replace(/ /g, "");
	    keystring = keystring || "sb";
	    if (!CT.dom.id(keystring + "panel" + nospace)) {
	        var n = CT.dom.node("", "div", keystring + "panel hidden", keystring + "panel" + nospace);
	        n.appendChild(CT.dom.node(key, "div", "bigger blue bold bottompadded"));
	        n.appendChild(CT.dom.node("", "div", "", keystring+"content"+nospace));
	        (panelnode || CT.dom.id(keystring+"panels")).appendChild(n);
	    }
	    var i = CT.dom.id(keystring+"item"+nospace);
	    if (i)
	        i.style.display = "block";
	    else {
	        itemnode = itemnode || CT.dom.id(keystring+"items");
	        var clickfunc = function() {
	        	if (condition && !condition()) return;
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
	    if (view1)
	    	CT.panel.view1[keystring + key] = view1;
	},
	"rename": function(oldkey, newkey, keystring, item2keystring) {
		keystring = keystring || "sb";
		var nsold = oldkey.replace(/ /g, ""),
			nsnew = newkey.replace(/ /g, ""),
			item = CT.dom.id(keystring + "item" + nsold),
			panel = CT.dom.id(keystring + "panel" + nsold),
			content = CT.dom.id(keystring + "content" + nsold);
		item.id = keystring + "item" + nsnew;
		panel.id = keystring + "panel" + nsnew;
		if (content) content.id = keystring + "content" + nsnew;
		item.firstChild.innerHTML = panel.firstChild.innerHTML = newkey;
		var item2 = item2keystring && CT.dom.id(item2keystring + "item" + nsold);
		if (item2) {
			item2.id = nsnew;
			item2.firstChild.innerHTML = newkey;
		}
	},
	"remove": function(key, keystring) {
	    var nospace = key.replace(/ /g, "");
	    var p = CT.dom.id(keystring+"panel"+nospace);
	    if (p) p.style.display = "none";
	    var l = CT.dom.id(keystring+"item"+nospace);
	    if (l) l.style.display = "none";
	},
	"load": function(pnames, trysidepanel, keystring, itemnode, panelnode, nospaces, icons, noclear, stillswap, cbs, condition, view1) {
	    keystring = keystring || "sb";
	    if (!noclear)
	        (itemnode || CT.dom.id(keystring+"items")).innerHTML = "";
	    for (var i = 0; i < pnames.length; i++)
	        CT.panel.add(pnames[i], trysidepanel, keystring, itemnode,
	            panelnode, nospaces && nospaces[i] || null,
	            icons && icons[i] || null, cbs && cbs[i] || null, condition, view1);
	    if (pnames.length && (stillswap || (!itemnode && !noclear)))
	        CT.panel.swap(pnames[0], trysidepanel, keystring);
	},
	"simple": function(pnames, keystring, itemnode, panelnode, cbs, condition, trysidepanel, nospaces, icons, noclear, stillswap, view1) {
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			pnames = obj.pnames;
			keystring = obj.keystring;
			itemnode = obj.itemnode;
			panelnode = obj.panelnode;
			cbs = obj.cbs;
			condition = obj.condition;
			trysidepanel = obj.trysidepanel;
			nospaces = obj.nospaces;
			icons = obj.icons;
			noclear = obj.noclear;
			stillswap = obj.stillswap;
			view1 = obj.view1;
		}
		CT.panel.load(pnames, trysidepanel, keystring, itemnode, panelnode,
			nospaces, icons, noclear, stillswap != false, cbs, condition, view1);
	},
	"pager": function(getContent, request, limit, colClass, dataClass, ks) {
		var keystring = ks || ("p" + CT.Pager._id),
			content = CT.dom.node(null, null, dataClass, keystring + "panels"),
			sideBar = CT.dom.node(),
			pager = new CT.Pager(function(data) {
				var dnames = data.map(function(d) { return d.label; });
				CT.panel.simple(dnames, keystring, sideBar, content);
				data.forEach(function(d) {
					CT.dom.setContent(CT.dom.id(keystring + "content"
						+ d.label.replace(/ /g, ""),
						true), getContent(d));
				});
				return sideBar;
			}, request, limit, colClass, keystring + "items"),
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