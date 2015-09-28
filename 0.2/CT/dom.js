CT.dom = {
	// basic nodes
	"node": function(content, type, classname, id, attrs) {
	    var d = document.createElement(type || "div");
	    if (content !== "" && content != null) {
	        if (type == "table")
	            alert("illegal innerHTML set on table! content: "+content);
	        else if (type == "style") {
	            d.type = 'text/css';
	            if (d.styleSheet) {
	                d.styleSheet.cssText = content;
	            } else {
	                d.appendChild(document.createTextNode(content));
	            }
	        }
	        else
	            d.innerHTML = content;
	    }
	    if (classname)
	        d.className = classname;
	    if (id)
	        d.id = id;
	    attrs = attrs || {};
	    for (var attr in attrs) {
	        if (attrs[attr] == null)
	            continue;
	        if (attr == "onclick")
	            d.onclick = attrs[attr];
	        else if (attr == "value")
	            d.value = attrs[attr];
	        else
	            d.setAttribute(attr, attrs[attr]);
	    }
	    return d;
	},
	"script": function(src, content, delay) {
	    if (delay)
	        content = "setTimeout(function() { " + content + " }, 1000);";
	    return CT.dom.node(content, "script", null, null, { "src": src });
	},
	"link": function(content, onclick, href, classname, id, attrs, newtab) {
	    if (attrs == null)
	        attrs = {};
	    if (onclick)
	        attrs.onclick = onclick;
	    if (href)
	        attrs.href = href;
	    if (newtab)
	        attrs.target = "_blank";
	    return CT.dom.node(content, "a", classname, id, attrs);
	},
	"button": function(content, onclick, classname, id) {
	    return CT.dom.node(content, "button", classname, id, {"onclick": onclick});
	},
	"field": function(id, value, classname, type) {
	    return CT.dom.node("", "input", classname, id,
	    	(value!=null || type!=null) && {"value": value, "type": type} || null);
	},
	"textArea": function(id, value, classname) {
	    return CT.dom.node("", "textarea", classname,
	    	id, value && {"value": value} || null);
	},
	"img": function(imgsrc, imgclass, onclick, _href, _target, _title, _linkid, wclass) {
	    var n = CT.dom.node("", "img", imgclass, "", {"src": imgsrc});
	    if (onclick || _href) {
	        var l = CT.dom.link("", onclick, _href);
	        if (_target)
	            l.target = _target;
	        if (_title)
	            l.title = l.alt = _title;
	        if (_linkid)
	            l.id = _linkid;
	        if (wclass)
	            n = CT.dom.wrapped(n, "div", wclass);
	        l.appendChild(n);
	        return l;
	    }
	    return n;
	},
	"select": function(onames, ovalues, id, curvalue, defaultvalue) {
	    ovalues = ovalues || onames;
	    var s = CT.dom.node("", "select", "", id);
	    for (var i = 0; i < onames.length; i++) {
	        s.appendChild(CT.dom.node(onames[i], "option",
	            "", "", {"value": ovalues[i]}));
	    }
	    if (curvalue)
	        s.value = ovalues.indexOf(curvalue) != -1 && curvalue || defaultvalue;
	    return s;
	},
	"checkbox": function(id, ischecked) {
	    var cbdata = {"type": "checkbox"};
	    if (ischecked)
	        cbdata.checked = ischecked;
	    return CT.dom.node("", "input", "", id, cbdata);
	},
	"wrapped": function(nodes, type, className, id, attrs) {
	    var wrapper = CT.dom.node("", type, className, id, attrs);
	    if (!Array.isArray(nodes))
	        nodes = [nodes];
	    for (var i = 0; i < nodes.length; i++)
	        wrapper.appendChild(nodes[i]);
	    return wrapper;
	},

	// composite nodes
	"checkboxAndLabel": function(cbid, ischecked, lname, lclass, cclass, onclick) {
	    var n = CT.dom.node("", "div", cclass);
	    var cbname = cbid+"checkbox";
	    var cb = CT.dom.checkbox(cbname, ischecked);
	    n.appendChild(cb);
	    if (onclick) {
	        cb.onclick = function() {
	            onclick(cb);
	        };
	    }
	    n.appendChild(CT.dom.node(lname || cbid, "label", lclass, "",
	        {"for": cbname, "htmlFor": cbname}));
	    return n;
	},
	"resizeTextArea": function(cbody) {
	    // expander/contracter
	    // from http://www.webdeveloper.com/forum/archive/index.php/t-61552.html
	    if (navigator.appName.indexOf("Microsoft Internet Explorer") == 0)
	        cbody.style.overflow = 'visible';
	    else {
	        while (cbody.rows > 1 && cbody.scrollHeight < cbody.offsetHeight)
	            cbody.rows--;
	        while (cbody.scrollHeight > cbody.offsetHeight)
	            cbody.rows++;
	    }
	},
	"labelAndField": function(lname, fid, fclass, lclass, fval, ista, isresize) {
	    fid = fid || lname.replace(/ /g, "");
	    var n = CT.dom.node();
	    var finput = CT.dom[(ista && "textArea" || "field")](fid,
	        fval, "right "+(fclass||""),
	        (lname.indexOf("Password") != -1) && "password" || null);
	    if (ista && isresize) {
	        finput.onkeyup = function() {
	            CT.dom.resizeTextArea(finput);
	            return true;
	        };
	    }
	    n.appendChild(finput);
	    n.appendChild(CT.dom.node(lname, "label", lclass,
	        null, {"for": fid, "htmlFor": fid}));
	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	    return n;
	},
	"_radioStripStep": function(radios, labels, lname, cb, stripname, stripnum, ison) {
	    var fname = (stripname || "radiostrip") + (stripnum || "") + lname;
	    var f = CT.dom.field(fname, null, null, "radio");
	    f.name = (stripname||"")+(stripnum||"");
	    f.onclick = function() {
	        cb(lname);
	    };
	    if (ison)
	        f.checked = true;
	    radios.insertCell(-1).appendChild(f);
	    labels.insertCell(-1).appendChild(CT.dom.node(lname,
	        "label", null, null,
	        {"htmlFor": fname, "for": fname}));
	},
	"radioStrip": function(pnode, lnames, cb, stripname, stripnum, stripval) {
	    var rtable = CT.dom.node("", "table");
	    rtable.style.textAlign = "center";
	    var radios = rtable.insertRow(0);
	    var labels = rtable.insertRow(1);
	    for (var i = 0; i < lnames.length; i++)
	        CT.dom._radioStripStep(radios, labels, lnames[i],
	        	cb, stripname, stripnum, lnames[i] == stripval);
	    pnode.appendChild(rtable);
	},
	"linkWithIcon": function(icon, lname, laddr, lonclick) {
	    var n = CT.dom.node("", "span");
	    n.appendChild(CT.dom.img(icon, "vmiddle rpaddedsmall nodecoration", lonclick, laddr));
	    n.appendChild(CT.dom.link(lname, lonclick, laddr));
	    return n;
	},
	"labeledImage": function(img, href, label, _alt, _icl, _wcl, _lcl, reverseNodes) {
	    var nlink = CT.dom.link();
	    var imageNode = CT.dom.img(img, _icl);
	    var labelNode = CT.dom.node(label, "div", _lcl);
	    if (reverseNodes) {
	        nlink.appendChild(labelNode);
	        nlink.appendChild(imageNode);
	    } else {
	        nlink.appendChild(imageNode);
	        nlink.appendChild(labelNode);
	    }
	    nlink.href = href;
	    nlink.target = "_blank";
	    nlink.title = nlink.alt = _alt || label;
	    return CT.dom.wrapped(nlink, "div", _wcl);
	},
	"buildForm": function(section, fields) {
	    var table = document.getElementById(section + "Table");
	    for (var i = 0; i < fields.length; i++) {
	        var field = fields[i];
	        var id = section + field.replace(/ /g, "");
	        var row = table.insertRow(-1);
	        row.insertCell(0).appendChild(CT.dom.node(field,
	            "label", "", "", {"htmlFor": id, "for": id}));
	        var inputTag = CT.dom.field(id);
	        if (field.indexOf("Password") != -1)
	            inputTag.type = "password";
	        row.insertCell(1).appendChild(inputTag);
	    }
	    return table;
	},

	// date selector
	"_monthnames": ["January", "February",
	    "March", "April", "May", "June", "July", "August",
	    "September", "October", "November", "December"],
	"currentyear": Math.max((new Date()).getFullYear(), 2014),
	"dateSelectors": function(node, d, startdate, enddate, withtime, noday) {
	    var eyears = ["Year"];
	    startdate = startdate || CT.dom.currentyear;
	    enddate = enddate || CT.dom.currentyear;
	    for (var i = startdate; i <= enddate; i++)
	        eyears.push(i);
	    d.year = CT.dom.select(eyears);
	    d.month = CT.dom.select(["Month"].concat(CT.dom._monthnames),
	        ["Month", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	    node.appendChild(d.year);
	    node.appendChild(d.month);
	    if (!noday) {
	        d.day = CT.dom.select(["Day", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
	            11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
	            25, 26, 27, 28, 29, 30, 31]);
	        node.appendChild(d.day);
	    }
	    if (withtime) {
	        // hour, minute = etime.split(":") server-side
	        var etimes = ["Time"];
	        for (var i = 0; i < 24; i++) {
	            etimes.push(i+":"+"00");
	            etimes.push(i+":"+"30");
	        }
	        d.time = CT.dom.select(etimes);
	        node.appendChild(d.time);
	    }
	},

	// password prompt
	"_pwpcb": null,
	"passwordPrompt": function(cb) {
	    CT.dom._pwpcb = cb;
	    var pwprompt = document.getElementById("passwordprompt");
	    var pwpfield = document.getElementById("pwpfield");
	    if (pwprompt == null) {
	        pwprompt = CT.dom.node("", "div", "hidden basicpopup centered", "passwordprompt");
	        document.body.appendChild(pwprompt);
	        pwprompt.appendChild(CT.dom.node("For your own security, please enter your password.", "div", "bottompadded"));
	        pwpfield = CT.dom.field("pwpfield", null, null, "password");
	        pwprompt.appendChild(pwpfield);
	        var entercb = function() {
	            if (! CT.parse.validPassword(pwpfield.value))
	                return alert("invalid password!");
	            pwprompt.style.display = "none";
	            CT.dom._pwpcb(pwpfield.value);
	        };
	        CT.dom.inputEnterCallback(pwpfield, entercb);
	        pwprompt.appendChild(CT.dom.button("Continue", entercb));
	        pwprompt.appendChild(CT.dom.button("Cancel", function() {
	            pwprompt.style.display = "none";
	        }));
	    }
	    pwpfield.value = "";
	    pwprompt.style.display = "block";
	    pwpfield.focus();
	    CT.align.centered(pwprompt);
	},

	// fields
	"_blurs": {},
	"setBlur": function(fieldId, values) {
	    CT.dom._blurs[fieldId] = values;
	},
	"getFieldValue": function(fieldId, fieldPath, rules) {
	    var field = document.getElementById(fieldId);
	    if (!field)
	        return null;
	    if (fieldPath) {
	        for (var i = 0; i < fieldPath.length; i++)
	            field = field[fieldPath[i]];
	    }
	    var s = field.value;
	    if (s == "" || (CT.dom._blurs[fieldId] && CT.dom._blurs[fieldId].indexOf(s) != -1))
	        return "";
	    if (rules) {
	        if (rules.requires) {
	            for (var i = 0; i < rules.requires.length; i++) {
	                if (s.indexOf(rules.requires[i]) == -1) {
	                    s = "";
	                    break;
	                }
	            }
	        }
	        if ((s && s.length || 0) < (rules.length || 0))
	            s = "";
	    }
	    return s;
	},
	"blurField": function(field, useblurs) {
	    useblurs = CT.dom._blurs[field.id] = useblurs || CT.dom._blurs[field.id];
	    if (useblurs) {
	        field.onblur = function() {
	            if (field.value == "") {
	                if (field.className.indexOf("gray") == -1)
	                    field.className += " gray";
	                field.value = useblurs[Math.floor(Math.random()*useblurs.length)];
	            }
	            else {
	                field.className = field.className.replace(" gray", "");
	            }
	        };
	        field.onfocus = function() {
	            if (useblurs.indexOf(field.value) != -1) {
	                field.value = "";
	                field.className = field.className.replace(" gray", "");
	            }
	        };
	        field.onblur();
	    }
	},
	"setFieldValue": function(value, fieldId, fieldPath) {
	    var field = document.getElementById(fieldId);
	    if (!field)
	        return setTimeout(CT.dom.setFieldValue, 500, value, fieldId, fieldPath);
	    if (fieldPath) {
	        for (var i = 0; i < fieldPath.length; i++)
	            field = field[fieldPath[i]];
	    }
	    field.value = value || "";
	    CT.dom.blurField(field);
	},
	"genfield": function(ftype, n, d, u, val, node2) {
	    var f = CT.dom.field("up"+ftype, val || u[ftype],
	        "right w280", (ftype.indexOf("password") != -1) && "password" || null);
	    d[ftype] = f;
	    n.appendChild(f);
	    n.appendChild(CT.dom.node(CT.parse.key2title(ftype), "label", "bold",
	        null, {"for": "up" + ftype, "htmlFor": "up" + ftype}));
	    if (node2) {
	        n.appendChild(CT.dom.node("&nbsp;&nbsp;", "span"));
	        n.appendChild(node2);
	    }
	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	},
	"inputEnterCallback": function(n, cb, fid) {
	    n.onkeyup = function(e) {
	        e = e || window.event;
	        var code = e.keyCode || e.which;
	        if (code == 13 || code == 3) {
	            // can prevent annoying repeating alert on enter scenarios
	            if (fid)
	                document.getElementById(fid).focus();
	            cb && cb(n.value);
	        }
	    };
	    return n;
	},

	// rich input stuff
	"_ricounter": 0,
	"_get_ta_id": function() {
	    var taid = "richinput" + CT.dom._ricounter;
	    CT.dom._ricounter += 1;
	    return taid;
	},
	"richInput": function(inputnode, taid, submitbutton, content, charlimit, blurs, noclear) {
	    taid = taid || CT.dom._get_ta_id();
	    charlimit = charlimit || 500;
	    var cbody = CT.dom.textArea(taid, content, "fullwidth");
	    CT.dom.blurField(cbody, blurs);
	    inputnode.appendChild(CT.dom.wrapped(cbody));
	    var charcount = CT.dom.node("(" + charlimit
	    	+ " chars left)", "div", "right", taid + "cc");
	    cbody.onkeyup = function(e) {
	        e = e || window.event;

	        // counter
	        var c = CT.dom.getFieldValue(taid).length;
	//        var c = cbody.value.length;
	        if (c > charlimit) {
	            cbody.value = cbody.value.slice(0, charlimit);
	            charcount.className = "right bold";
	            if (e.preventDefault)
	                e.preventDefault();
	            return false;
	        }
	        else
	            charcount.className = "right";
	        charcount.innerHTML = "(" + (charlimit - c) + " chars left)";

	        CT.dom.resizeTextArea(cbody);

	        return true;
	    };
	    inputnode.appendChild(charcount);
	    if (submitbutton)
	        inputnode.appendChild(submitbutton);
	    else if (!noclear)
	        inputnode.appendChild(CT.dom.node("", "div", "clearnode"));
	    return cbody;
	},

	// wysiwyg editor widget
	"wysiwygize": function(nodeid, isrestricted, val, cb, mismatchcb) {
	    var d = {
	        "plugins": "paste",
	        "paste_auto_cleanup_on_paste": true,
	        "mode": "exact",
	        "elements": nodeid,
	        "theme": "advanced",
	        "skin": "o2k7",
	        "theme_advanced_buttons1": "bold,italic,|,justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,outdent,indent,blockquote,|,link,unlink,undo,redo",
	        "theme_advanced_buttons2": "pastetext,pasteword,selectall",
	        "theme_advanced_buttons3": "",
	        "theme_advanced_statusbar_location": "bottom",
	        "theme_advanced_toolbar_location": "top",
	        "theme_advanced_toolbar_align": "left",
	        "theme_advanced_resizing": true,
	        "theme_advanced_resize_horizontal": false,
	        "width": "100%",
	        "force_br_newlines": true,
	        "force_p_newlines": false,
	        "forced_root_block": false
	    };
	    if (! isrestricted) {
	        d.plugins += ",table";
	        d.theme_advanced_buttons2 += ",|,image,tablecontrols";
	        d.theme_advanced_buttons3 = "";
	    }
	    tinyMCE.init(d);
	    var n = document.getElementById(nodeid);
	    var dothiscbs = [];
	    var doset = function(s, followup) {
	        n.node.setContent(s);
	        if (followup && s != n.get() && confirm("Our WYSIWYG text editor seems to have changed the formatting of your text. Don't worry, it probably still looks the same. Press OK to resave your slightly reformatted content, or Cancel if you don't want to."))
	            followup();
	    };
	    n.get = function(stripnbsp) {
	        var c = n.node.getContent();
	        if (stripnbsp) while (c.slice(-6) == "&nbsp;")
	            c = c.slice(0, -6);
	        return c;
	    };
	    n.dothis = function(f) {
	        f && dothiscbs.push(f);
	        n.node = n.node || tinyMCE.get(nodeid);
	        if (!n.node)
	            return setTimeout(n.dothis, 200);
	        for (var i = 0; i < dothiscbs.length; i++)
	            dothiscbs[i]();
	        dothiscbs.length = 0;
	    };
	    n.set = function(s, followup) {
	        n.node ? doset(s, followup) : n.dothis(function() { doset(s, followup); });
	    };
	    n.dothis(function() {
	        val && n.set(val, mismatchcb);
	        cb && cb();
	    });
	},
	"qwiz": function(nodeid, val) {
	    var n = document.getElementById(nodeid);
	    if (!n || n.get)
	        return setTimeout(CT.dom.qwiz, 500, nodeid, val);
	    !n.get && CT.dom.wysiwygize(nodeid, true, val);
	},

	// visibility
	"showHideT": function(n) {
	    n.style.opacity = n.style.opacity == "1" && "0" || "1";
	},
	"showHide": function(n, juston, justoff, dstyle) {
	    dstyle = dstyle || "block";
	    if (juston || justoff)
	        n.style.display = juston && dstyle || "none";
	    else if (n.style.display == "" && n.className.indexOf("hidden") == -1)
	        n.style.display = "none";
	    else
	        n.style.display = (n.style.display == dstyle) && "none" || dstyle;
	},
	"showHideSet": function(nodes, juston, justoff, dstyle) {
	    for (var i = 0; i < nodes.length; i++)
	        CT.dom.showHide(nodes[i], juston, justoff, dstyle);
	},

	// ALLNODE stuff
	"ALLNODE": null,
	"loadAllNode": function() {
	    if (!CT.dom.ALLNODE) {
	        CT.dom.ALLNODE = document.getElementById("all");
	        CT.dom.ALLNODE._mobile = CT.align.width() <= 720;
	    }
	},
	"getAllNode": function() {
	    CT.dom.loadAllNode();
	    return CT.dom.ALLNODE;
	},
	"showAllNode": function() {
		var _a = CT.dom.ALLNODE;
	    _a.style.opacity = _a.style["-moz-opacity"] = _a.style["-khtml-opacity"] = "1";
	    _a.style.filter = "alpha(opacity = 100)";
	    _a.style["-ms-filter"] = "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
	},

	// dynamically add style rules
	"addStyle": function(s) {
	    document.getElementsByTagName("head")[0]
	        .appendChild(CT.dom.node(s, "style"));
	},

	// defer function until node exists in dom
	"doWhenNodeExists": function(id, cb) {
	    if (document.getElementById(id))
	        return cb();
	    setTimeout(CT.dom.doWhenNodeExists, 1000, id, cb);
	},

	// determine iframe location
	"getLoc": function(iframe) {
	    return (iframe.documentWindow || iframe.contentWindow || iframe.contentDocument).location;
	},

	// transitions
	"_vender_prefixes": [
	    "-webkit-",
	    "-moz-",
	    "-ms-",
	    "-o-",
	    ""
	],
	"setVenderPrefixed": function(node, property, value) {
	    for (var i = 0; i < CT.dom._vender_prefixes.length; i++)
	        node.style[CT.dom._vender_prefixes[i] + property] = value;
	},
	"_tswap": { "transform": "-webkit-transform" }, // mobile safari transitions
	"trans": function(node, cb, property, duration, ease, value, prefix) {
	    duration = duration || 500;
	    property && CT.dom.setVenderPrefixed(node, "transition",
	        (CT.dom._tswap[property] || property)
	        + " " + duration + "ms " + (ease || "ease-in-out"));
	    if (cb) {
	        var transTimeout, wrapper = function () {
	            property && CT.dom.setVenderPrefixed(node, "transition", "");
	            clearTimeout(transTimeout);
	            transTimeout = null;
	            node.removeEventListener("webkitTransitionEnd", wrapper, false);
	            node.removeEventListener("mozTransitionEnd", wrapper, false);
	            node.removeEventListener("oTransitionEnd", wrapper, false);
	            node.removeEventListener("transitionend", wrapper, false);
	            cb();
	        }
	        node.addEventListener("webkitTransitionEnd", wrapper, false);
	        node.addEventListener("mozTransitionEnd", wrapper, false);
	        node.addEventListener("oTransitionEnd", wrapper, false);
	        node.addEventListener("transitionend", wrapper, false);
	        transTimeout = setTimeout(wrapper, duration);
	    }
	    if (value && property) {
	        if (prefix)
	            CT.dom.setVenderPrefixed(node, property, value);
	        else
	            node.style[property] = value;
	    }
	}
};