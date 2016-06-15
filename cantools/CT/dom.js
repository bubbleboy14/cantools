/*
This module contains functions for interacting with the DOM. This includes:

### simple and compound node creation
#### CT.dom.node(content, type, classname, id, attrs, style)
	- content - what goes in the resulting DOM node. may be:
	  - a node
	  - a function
	  - an object
	  - a string or number
	  - an array containing any of the above
	- type - tag name of resulting DOM node
	- classname - class of resulting DOM node
	- id - id of resulting DOM node
	- attrs - object defining miscellaneous properties of resulting DOM node
	- style - object mapping CSS properties to values

All other node generators use CT.dom.node() under the hood. There are many. See code.

### selectors
#### CT.dom.id(id, all)
	- 'all' is a bool indicating whether to also search free-floating nodes.
#### CT.dom.className(cname, n)
	- 'n' is the node to search. defaults to document.
#### CT.dom.tag(tag, n)
	- 'n' is the node to search. defaults to document.
#### CT.dom.Q(q, n)
	- executes querySelectorAll(q) on n (defaults to document)

### style modding
#### CT.dom.mod(opts)
	- 'opts' object must include:
	  - property: CSS property to modify
	  - value: new value
	- 'opts' object must include one of:
	  - target (node)
	  - targets (node array)
	  - className (string)
	  - id (string)
#### CT.dom.addStyle(text, href, obj)
	- use EITHER text, href, or obj
	  - text: raw CSS text
	  - href: url of stylesheet
	  - obj: object mapping selector strings to style definitions (specified
			 via embedded objects mapping CSS properties to values)
*/

CT.dom = {
	// basic nodes
	"_autoparse": false,
	"setAutoparse": function(bool) {
		CT.dom._autoparse = bool;
	},
	"_nodes": {}, // node()-generated nodes with ids
	"_obj2node": function(attrs) {
		var args = [];
		if (attrs.builder) {
			attrs.content = attrs.items.map(function(item) {
				return attrs.builder(item);
			});
			delete attrs.builder;
			delete attrs.items;
		}
		["content", "type", "classname", "id"].forEach(function(a) {
			args.push(attrs[a]);
			delete attrs[a];
		});
		args.push(attrs);
		if (attrs.style) {
			args.push(attrs.style);
			delete attrs.style;
		}
		return CT.dom.node.apply(null, args);
	},
	"node": function(content, type, classname, id, attrs, style) {
		var d = document.createElement(type || "div");
		if (content) {
			if (Array.isArray(content)) // array of nodes or objects
				content.forEach(function(item) {
					d.appendChild(item instanceof Node ? item : CT.dom.node(item));
				});
			else if (content instanceof Node) // single node
				d.appendChild(content);
			else if (typeof content == "function")
				d.appendChild(content());
			else if (typeof content == "object")
				return CT.dom._obj2node(content); // do this without creating 'd' node?
			else if (typeof content == "string" || typeof content == "number") {
				if (type == "table")
					alert("illegal innerHTML set on table! content: " + content);
				else if (type == "style") {
					d.type = 'text/css';
					if (d.styleSheet) {
						d.styleSheet.cssText = content;
					} else {
						d.appendChild(document.createTextNode(content));
					}
				}
				else {
					if (CT.dom._autoparse)
						content = CT.parse.process(content.toString());
					d.innerHTML = content;
				}
			}
		}
		if (classname)
			d.className = classname;
		if (id) {
			d.id = id;
			CT.dom._nodes[id] = d;
		}
		d.on = function(e, func) {
			if (func)
				return d.addEventListener(e, func);
			for (var k in e)
				d.addEventListener(k, e[k]);
		};
		if (attrs) {
			for (var attr in attrs) {
				if (attrs[attr] == null)
					continue;
				if (attr == "value" || attr == "onclick")
					d[attr] = attrs[attr];
				else if (attr.slice(0, 2) == "on")
					d.on(attr.slice(2), attrs[attr]);
				else
					d.setAttribute(attr, attrs[attr]);
			}
		}
		if (style)
			for (var rule in style)
				d.style[rule] = style[rule];
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
	"fieldList": function(vals, maker) {
		var n = CT.dom.node(vals.map(function(v) {
			var butt = CT.dom.button("(remove)", function() {
				CT.dom.remove(butt.parentNode);
			});
			return CT.dom.node([
				maker ? maker(v) : CT.dom.field(null, v), butt
			]);
		}));
		n.value = function() {
			return n.childNodes.map(function(wrapper) {
				return wrapper.firstChild.value;
			});
		};
		return n;
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
				n = CT.dom.node(n, "div", wclass);
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
	"range": function(onchange, min, max, value, step, classname, id) {
		var r = CT.dom.node("", "input", classname, id, {
			"type": "range",
			"oninput": onchange && function() { onchange(r.value); },
			"min": min,
			"max": max,
			"value": value,
			"step": step
		});
		return r;
	},
	"checkbox": function(id, ischecked, style) {
		var cbdata = {"type": "checkbox"};
		if (ischecked)
			cbdata.checked = ischecked;
		return CT.dom.node("", "input", "", id, cbdata, style);
	},
	"wrapped": function(nodes, type, className, id, attrs) {
		CT.log("[DEPRECATION WARNING] CT.dom.wrapped() is deprecated. Use CT.dom.node().");
		var wrapper = CT.dom.node("", type, className, id, attrs);
		if (!Array.isArray(nodes))
			nodes = [nodes];
		for (var i = 0; i < nodes.length; i++)
			wrapper.appendChild(nodes[i]);
		return wrapper;
	},
	"audio": function(src, autoplay, onplay, onended, className, id, attrs) {
		attrs = attrs || {};
		attrs.src = src;
		if (autoplay)
			attrs.autoplay = "true";
		if (onplay)
			attrs.onplay = onplay;
		if (onended)
			attrs.onended = onended;
		return CT.dom.node("", "audio", className, id, attrs);
	},
	"iframe": function(src, className, id) {
		var iframe = CT.dom.node("", "iframe", className, id, {
			"src": src
		});
		iframe.setHash = function(txt) {
			CT.dom.getLoc(iframe).hash = txt;
		};
		return iframe;
	},
	"pad": function(psize) {
		psize = psize || 1;
		var ptxt = "";
		for (var i = 0; i < psize; i++)
			ptxt += "&nbsp;";
		return CT.dom.node(ptxt, "span");
	},
	"marquee": function(content, className, direction) {
		var n = CT.dom.node(content, "marquee", className, null, {
			direction: direction || "left",
			behavior: "alternate"
		});
		setTimeout(function() {
			CT.dom.each(n, function(sub) {
				sub.style.height = n.clientHeight + "px";
			});
		});
		return n;
	},

	// iframe getters
	"getDoc": function(iframe) {
		return iframe.documentWindow || iframe.contentWindow || iframe.contentDocument;
	},
	"getLoc": function(iframe) {
		return CT.dom.getDoc(iframe).location;
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
	"labeledImage": function(img, href, label, _alt, _icl, _wcl, _lcl, reverseNodes, onclick) {
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
		nlink.title = nlink.alt = _alt || label;
		var w = CT.dom.node(nlink, "div", _wcl);
		if (href) {
			nlink.href = href;
			nlink.target = "_blank";
		} else if (onclick)
			w.onclick = onclick;
		return w;
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
	"timer": function(start, cb, classname, id, attrs) {
		var n = CT.dom.node(start, "div", classname, id, attrs);
		n._sec = start;
		n._check = function() {
			n._sec -= 1;
			n.innerHTML = n._sec;
			if (n._sec == 0) {
				n.stop();
				cb && cb();
			}
		};
		n.set = function(val) {
			n.innerHTML = n._sec = val;
		};
		n.start = function() {
			n.stop();
			n._interval = setInterval(n._check, 1000);
		};
		n.stop = function() {
			if (n._interval) {
				clearInterval(n._interval);
				n._interval = null;
			}
		};
		n.start();
		return n;
	},
	"choices": function(nodes, multi, cellClass, selectedClass, onchange) {
		selectedClass = selectedClass || "grayback";
		var n = CT.dom.node();
		n._sel = null;
		n.value = multi ? [] : -1;
		nodes.forEach(function(node, i) {
			node.onclick = function() {
				if (!multi && n._sel)
					n._sel.classList.remove(selectedClass);
				n._sel = node;
				if (node.classList.contains(selectedClass)) {
					node.classList.remove(selectedClass);
					if (multi)
						CT.data.remove(n.value, i);
					else
						n.value = [];
				} else {
					node.classList.add(selectedClass);
					if (multi)
						CT.data.append(n.value, i);
					else
						n.value = i;
				}
				onchange && onchange(i);
			};
			node.classList.add(cellClass || "choice_cell");
			n.appendChild(node);
		});
		return n;
	},
	"form": function(content, action, method, classname, id) {
		return CT.dom.node(content, "form", classname, id, {
			method: method || "post",
			action: action
		});
	},
	"spinner": function() {
		return CT.dom.node(CT.dom.node([
			CT.dom.node("loading...", "strong"),
			CT.dom.node("", "span")
		], "div", "ctspinner"), "div", "ctswrap");
	},

	// date selector
	"_monthnames": ["January", "February",
		"March", "April", "May", "June", "July", "August",
		"September", "October", "November", "December"],
	"currentyear": Math.max((new Date()).getFullYear(), 2014),
	"dateSelectors": function(node, d, startdate, enddate, withtime, noday, val) {
		var eyears = ["Year"];
		startdate = startdate || CT.dom.currentyear;
		enddate = enddate || CT.dom.currentyear;
		for (var i = startdate; i <= enddate; i++)
			eyears.push(i);
		node = node || CT.dom.node(null, "span");
		d = d || node;
		d.year = CT.dom.select(eyears);
		d.month = CT.dom.select(["Month"].concat(CT.dom._monthnames),
			["Month", "01", "02", "03", "04", "05",
			"06", "07", "08", "09", "10", "11", "12"]);
		node.appendChild(d.year);
		node.appendChild(d.month);
		if (!noday) {
			d.day = CT.dom.select(["Day", "01", "02", "03", "04", "05", "06", "07", "08",
				"09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
				"21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]);
			node.appendChild(d.day);
		}
		if (withtime) {
			// hour, minute = etime.split(":") server-side
			var etimes = ["Time"];
			for (var i = 0; i < 24; i++) {
				var istr = i < 10 ? "0" + i : i;
				etimes.push(istr + ":" + "00");
				etimes.push(istr + ":" + "30");
			}
			d.time = CT.dom.select(etimes);
			node.appendChild(d.time);
		}
		if (val) {
			var vsplit = val.split(" "),
				dsplit = vsplit[0].split("-");
			d.year.value = dsplit[0];
			d.month.value = dsplit[1];
			if (!noday)
				d.day.value = dsplit[2];
			if (withtime)
				d.time.value = vsplit[1].slice(0, -3);
		}
		d.value = function() {
			if (d.year.value == "Year" || d.month.value == "Month" || (!noday && d.day.value == "Day"))
				return null;
			var val = d.year.value + "-" + d.month.value;
			if (!noday)
				val += "-" + d.day.value;
			if (withtime)
				val += " " + d.time.value + ":00";
			else
				val += " 00:00:00";
			return val;
		};
		return node;
	},

	// password prompt
	"_pwpcb": null,
	"passwordPrompt": function(cb) {
		CT.log("[DEPRECATION WARNING] CT.dom.passwordPrompt() is deprecated. Use CT.Prompt instead.");
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
					field.classList.add("gray");
					field.value = useblurs[Math.floor(Math.random() * useblurs.length)];
				}
				else
					field.classList.remove("gray");
			};
			field.onfocus = function() {
				if (useblurs.indexOf(field.value) != -1) {
					field.value = "";
					field.classList.remove("gray");
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
	"smartField": function(cb, classname, id, value, type, blurs) {
		id = id || ("sf" + Math.floor((Math.random() * 100000)));
		var f = CT.dom.inputEnterCallback(CT.dom.field(id,
			value, classname, type), cb, id);
		if (blurs)
			CT.dom.blurField(f, blurs);
		return f;
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
		inputnode.appendChild(CT.dom.node(cbody));
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

	// visibility
	"showHideT": function(n) {
		n = n || document.body;
		n.style.opacity = n.style.opacity == "1" && "0" || "1";
	},
	"showHideV": function(n) {
		n = n || document.body;
		n.style.visibility = n.style.visibility == "visible" && "hidden" || "visible";
	},
	"showHide": function(n, juston, justoff, dstyle) {
		n = n || document.body;
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
	"show": function(n, dstyle) {
		CT.dom.showHide(n, true, false, dstyle);
	},
	"hide": function(n) {
		CT.dom.showHide(n, false, true);
	},
	"remove": function(n) {
		n && n.parentNode && n.parentNode.removeChild(n);
	},
	"addContent": function(targetNode, content) {
		if (typeof content == "function")
			content = content();
		if (Array.isArray(content))
			content = CT.dom.node(content);
		if (typeof content == "string")
			targetNode.innerHTML += content;
		else
			targetNode.appendChild(content);
	},
	"setContent": function(targetNode, content) {
		targetNode.innerHTML = "";
		CT.dom.addContent(targetNode, content);
	},
	"addEach": function(parent, subs) {
		subs.forEach(function(node) { // must wrap
			parent.appendChild(node);
		});
	},

	// ALLNODE stuff
	"ALLNODE": null,
	"loadAllNode": function() {
		if (!CT.dom.ALLNODE) {
			CT.dom.ALLNODE = document.getElementById("all");
			CT.dom.ALLNODE._mobile = CT.align.width() <= 720;
			window.onresize = function() {
				CT.dom.ALLNODE.resize();
				CT.align.resize();
			};
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
	"addStyle": function(text, href, obj) { // choose one!
		if (obj) {
			// obj is unordered. if ordered definitions are desired,
			// use repeated calls to addStyle, eg:
			//  - defchunks.forEach(function(c) { CT.dom.addStyle(null, null, c); });
			text = [];
			for (var key in obj) {
				text.push(key + " {");
				var pobj = obj[key];
				for (var prop in pobj)
					text.push(prop + ": " + pobj[prop] + ";");
				text.push("}");
			}
			text = text.join("\n");
		}
		var node = href ? CT.dom.node(null, "link", null, null,
			{ "href": href }) : CT.dom.node(text, "style");
		CT.dom.tag("head")[0].appendChild(node);
	},

	// defer function until node exists in dom
	"doWhenNodeExists": function(id, cb) {
		if (document.getElementById(id))
			return cb();
		setTimeout(CT.dom.doWhenNodeExists, 1000, id, cb);
	},

	// getters
	"id": function(id, all) { // 'all' means search free-floating nodes
		return document.getElementById(id) || all && CT.dom._nodes[id];
	},
	"_narr2arr": function(nodeArray) {
		var arr = [];
		for (var i = 0; i < nodeArray.length; i++)
			arr.push(nodeArray[i]);
		return arr;
	},
	"className": function(cname, n) { // can't call it "class"...
		return CT.dom._narr2arr((n || document).getElementsByClassName(cname));
	},
	"tag": function(tag, n) {
		return CT.dom._narr2arr((n || document).getElementsByTagName(tag));
	},
	"Q": function(q, n) {
		return CT.dom._narr2arr((n || document.body).querySelectorAll(q));
	},
	"each": function(p, f) {
		for (var i = 0; i < p.childNodes.length; i++)
			f(p.childNodes[i]);
	},
	"mod": function(opts) {
		var targets = opts.targets ? opts.targets
			: (opts.target ? [opts.target]
			: (opts.className ? CT.dom.className(opts.className)
			: (opts.id ? [CT.dom.id(opts.id)] : []))),
			property = opts.property || "display",
			value = opts.value ||
				(opts.show ? "block" : opts.hide ? "none" : "");
		for (var i = 0; i < targets.length; i++)
			targets[i].style[property] = value;
	}
};
