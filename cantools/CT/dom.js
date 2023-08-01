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
		if (content != null) {
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
			else if ((typeof content == "string" && content.length) || typeof content == "number") {
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
			if (!func) {
				for (var k in e)
					d.addEventListener(k, e[k]);
			}
			else if (e == "visible") {
				var io = new IntersectionObserver(function(entz) {
					if (entz[0].intersectionRatio)
						func();
				});
				io.observe(d);
			} else
				d.addEventListener(e, func);
		};
		if (attrs) {
			for (var attr in attrs) {
				if (attrs[attr] == null)
					continue;
				if (["value", "onclick", "srcObject"].indexOf(attr) != -1)
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
	"table": function(rows, classname, id, attrs, style) {
		return CT.dom.node(CT.dom.tableRows(rows), "table", classname, id, attrs, style);
	},
	"tableRows": function(rows) {
		return rows.map(function(row) {
			return CT.dom.node(row.map(function(cell) {
				return CT.dom.node(cell, "td");
			}), "tr");
		});
	},
	"addRows": function(ptable, rows) {
		for (var row of CT.dom.tableRows(rows))
			ptable.appendChild(row);
	},
	"div": function(content, classname, id, attrs, style) {
		return CT.dom.node(content, "div", classname, id, attrs, style);
	},
	"flex": function(content, classname, id, attrs, style) {
		return CT.dom.div(content, "flex " + (classname || "row"), id, attrs, style);
	},
	"span": function(content, classname, id, attrs, style) {
		return CT.dom.node(content, "span", classname, id, attrs, style);
	},
	"script": function(src, content, delay, onload) {
		if (delay)
			content = "setTimeout(function() { " + content + " }, " + delay + ");";
		return CT.dom.node(content, "script", null, null, { "src": src, "onload": onload });
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
	"button": function(content, onclick, classname, id, disabled) {
		return CT.dom.node(content, "button", classname, id, {
			"onclick": onclick,
			"disabled": disabled
		});
	},
	"field": function(id, value, classname, type, attrs, style, placeholder) {
		attrs = attrs || {};
		if (value || (typeof value == "number")) // for 0 edge case
			attrs.value = value;
		if (type)
			attrs.type = type;
		if (placeholder)
			attrs.placeholder = placeholder;
		return CT.dom.node("", "input", classname, id, attrs, style);
	},
	"file": function(cb, id, classname, multiple) {
		return CT.dom.field(id, null, classname,
			"file", { onchange: cb, multiple: multiple });
	},
	"fieldList": function(vals, maker, style, onadd, onremove, onchange, bottomadd, wrap, label) {
		if (arguments.length == 1 && vals && !Array.isArray(vals)) {
			var obj = vals;
			vals = obj.vals;
			maker = obj.maker;
			style = obj.style;
			onadd = obj.onadd;
			onremove = obj.onremove;
			onchange = obj.onchange;
			bottomadd = obj.bottomadd;
			wrap = obj.wrap;
			label = obj.label;
		}
		var input = function(v, i) { return maker ? maker(v, i) : CT.dom.field(null, v); },
			row = function(v, i) {
				var butt = CT.dom.button("remove", function() {
					CT.dom.remove(butt.parentNode);
					onremove && onremove(v);
					onchange && onchange(n.value());
				});
				return CT.dom.node([ butt, input(v, i) ]);
			}, n = CT.dom.node(vals && vals.map(row), null, null, null, null, style);
		n.empty = input();
		n.addButton = CT.dom.button("add", function() {
			if (n.empty.value) {
				var newRow = row(n.empty.value);
				bottomadd ? n.appendChild(newRow) : n.insertBefore(newRow, n.firstChild);
				onadd && onadd(newRow.lastElementChild);
				onchange && onchange(n.value());
				if (n.empty.fill)
					n.empty.fill()
				else
					n.empty.value = "";
			}
		});
		n.addButton.style.width = "57px";
		n.value = function() {
			return CT.dom.map(n, function(wrapper) {
				return wrapper.lastChild.value;
			});
		};
		if (label || wrap) {
			var wrapper = CT.dom.div([
				label, n.empty, n.addButton, n
			]);
			wrapper.value = n.value;
			return wrapper;
		}
		return n;
	},
	"textArea": function(id, value, classname) {
		return CT.dom.node("", "textarea", classname,
			id, value && {"value": value} || null);
	},
	"img": function(src, imgclass, onclick, href, target, title, linkid, wrapperclass, imgid, noanchor, style, attrs, loadFirst) {
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			src = obj.src;
			imgclass = obj.imgclass || obj.className;
			onclick = obj.onclick;
			href = obj.href;
			target = obj.target;
			title = obj.title;
			linkid = obj.linkid;
			wrapperclass = obj.wrapperclass;
			imgid = obj.imgid;
			noanchor = obj.noanchor;
			style = obj.style;
			attrs = obj.attrs;
			loadFirst = obj.loadFirst;
		}
		var n = CT.dom.node("", "img", imgclass, imgid, CT.merge({
			"src": !loadFirst && src
		}, attrs), style);
		if (loadFirst) {
			var img = new Image();
			img.src = src;
			n.style.opacity = 0;
			img.decode().then(function() {
				n.src = img.src;
				setTimeout(function() {
					n.style.opacity = 1;
				}, 100);
			});
		}
		if (noanchor) // implies onclick -- otherwise, no (compatible) need to specify
			n.onclick = onclick;
		else if (onclick || href) {
			var l = CT.dom.link("", onclick, href);
			if (target)
				l.target = target;
			if (title)
				l.title = l.alt = title;
			if (linkid)
				l.id = linkid;
			if (wrapperclass)
				n = CT.dom.div(n, wrapperclass);
			l.appendChild(n);
			return l;
		}
		return n;
	},
	"panImg": function(opts) {
		opts = CT.merge(opts, {
			pan: true,
			panDuration: 5000,
			className: "abs all0 noflow below"
		});
		var img = CT.dom.div(CT.dom.img(opts.img, "abs"), opts.className);
		if (opts.pan) {
			img.controller = CT.trans.pan(img.firstChild, {
				duration: opts.panDuration
			}, true);
			if (opts.controllerHook) {
				opts.controllerHook.hide = img.controller.pause;
				opts.controllerHook.show = img.controller.resume;
			}
		}
		return img;
	},
	"select": function(onames, ovalues, id, curvalue, defaultvalue, onchange, other, noto) {
		if (arguments.length == 1 && !Array.isArray(onames)) {
			var obj = onames;
			onames = obj.names;
			ovalues = obj.values;
			id = obj.id;
			curvalue = obj.curvalue;
			defaultvalue = obj.defaultvalue;
			onchange = obj.onchange;
			other = obj.other;
			noto = noto in obj ? obj.noto : true; // better default
		}
		ovalues = ovalues || onames;
		var s = CT.dom.node("", "select", "", id);
		if (other) {
			defaultvalue = defaultvalue || "other";
			if (ovalues.indexOf("other") == -1) {
				ovalues.push("other");
				if (ovalues != onames)
					onames.push("other");
			}
			s.other = CT.dom.field(null, (ovalues.indexOf(curvalue) == -1) && curvalue, "hidden");
			s.container = CT.dom.node([s, s.other]);
			s.container.value = function() {
				if (s.value == "other")
					return s.other.value.trim();
				return s.value;
			};
		}
		for (var i = 0; i < onames.length; i++) {
			s.appendChild(CT.dom.node(onames[i], "option",
				"", "", {"value": ovalues[i]}));
		}
		if (curvalue || defaultvalue)
			s.value = ovalues.indexOf(curvalue) != -1 && curvalue || defaultvalue;
		s.fieldValue = () => s.container ? s.container.value() : s.value;
		s.onchange = function() {
			if (other) {
				if (s.value == "other")
					s.other.style.display = "block";
				else
					s.other.style.display = "none";
			}
			onchange && onchange(s.value);
		};
		noto || setTimeout(s.onchange);
		return s.container || s;
	},
	"range": function(oninput, min, max, value, step, classname, id, onchange) {
		var r = CT.dom.node("", "input", classname, id, {
			"type": "range",
			"oninput": oninput && function() { oninput(r.value); },
			"onchange": onchange && function() { onchange(r.value); },
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
	"audio": function(src, controls, autoplay, preload, onplay, onended, className, id, attrs, oncanplay, onpause) {
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			src = obj.src;
			controls = obj.controls;
			autoplay = obj.autoplay;
			preload = obj.preload;
			onplay = obj.onplay;
			onended = obj.onended;
			className = obj.className;
			id = obj.id;
			attrs = obj.attrs;
			oncanplay = obj.oncanplay;
			onpause = obj.onpause;
		}
		attrs = attrs || {};
		attrs.src = src;
		if (controls)
			attrs.controls = "true";
		if (autoplay)
			attrs.autoplay = "true";
		if (onplay)
			attrs.onplay = onplay;
		if (onpause)
			attrs.onpause = onpause;
		if (onended)
			attrs.onended = onended;
		if (oncanplay)
			attrs.oncanplay = oncanplay;
		attrs.preload = attrs.preload || preload || "none";
		return CT.dom.node("", "audio", className, id, attrs);
	},
	"video": function(src, className, id, attrs, style, oncanplay, onended, onplay, onpause, poster, controls, autoplay) {
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			src = obj.src;
			className = obj.className;
			id = obj.id;
			attrs = obj.attrs;
			style = obj.style;
			oncanplay = obj.oncanplay;
			onended = obj.onended;
			onplay = obj.onplay;
			onpause = obj.onpause;
			poster = obj.poster;
			controls = obj.controls;
			autoplay = obj.autoplay;
		}
		attrs = attrs || {};
		var multisrc = false;
		if (Array.isArray(src))
			multisrc = true;
		else if (typeof src == "object")
			attrs.srcObject = src;
		else
			attrs.src = src;
		if (controls)
			attrs.controls = "true";
		if (autoplay)
			attrs.autoplay = "true";
		if (onplay)
			attrs.onplay = onplay;
		if (onpause)
			attrs.onpause = onpause;
		if (onended)
			attrs.onended = onended;
		if (oncanplay)
			attrs.oncanplay = oncanplay;
		if (poster)
			attrs.poster = poster;
		var n = CT.dom.node(multisrc && src.map(function(s) {
			return CT.dom.node(null, "source", null, null, {
				src: s
			});
		}), "video", className, id, attrs, style);
		n.stream = function(stream) {
			n.srcObject = stream;
			n.play();
		};
		return n;
	},
	"iframe": function(src, className, id, attrs, style) {
		if (arguments.length == 1 && typeof arguments[0] != "string") {
			var obj = arguments[0];
			src = obj.src;
			className = obj.className;
			id = obj.id;
			attrs = obj.attrs;
			style = obj.style;
		}
		var iframe = CT.dom.node("", "iframe", className, id, CT.merge({
			"src": src
		}, attrs), style);
		iframe.setHash = function(txt) {
			CT.dom.getLoc(iframe).hash = txt;
		};
		return iframe;
	},
	"pad": function(psize) {
		psize = psize || 1;
		var ptxt = "";
		for (var i = 0; i < psize; i++)
			ptxt += "&ensp;";
		return CT.dom.node(ptxt, "span");
	},
	"br": function(bsize, justbr) {
		if (justbr) return CT.dom.node(null, "br");
		bsize = bsize || 1;
		var bs = [];
		for (var i = 0; i < bsize; i++)
			bs.push(CT.dom.node(null, "br"));
		return CT.dom.node(bs);
	},
	"marquee": function(content, className, direction, noresize) {
		var n = CT.dom.node(content, "marquee", className, null, {
			direction: direction || "left",
			behavior: "alternate"
		});
		!noresize && setTimeout(function() {
			CT.dom.each(n, function(sub) {
				sub.style.height = n.clientHeight + "px";
			});
		});
		return n;
	},
	"label": function(content, htmlFor, className, click, hover) {
		var n = CT.dom.node(content, "label", className, null, {
			"for": htmlFor,
			"htmlFor": htmlFor
		});
		if (click) {
			n.onclick = function() {
				var tnode = CT.dom.id(htmlFor);
				tnode && tnode.onclick && tnode.onclick();
			};
		}
		hover && CT.hover.auto(n, hover);
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
	"checkboxAndLabel": function(cbid, ischecked, lname, lclass, cclass, onclick, namesuff) {
		if (!lname && cbid.indexOf(" ") != -1) {
			lname = cbid;
			cbid = cbid.replace(/ /g, "");
		}
		var n = CT.dom.node("", "div", cclass);
		var cbname = cbid+"checkbox";
		if (namesuff)
			cbname += namesuff;
		var cb = CT.dom.checkbox(cbname, ischecked);
		n.appendChild(cb);
		if (onclick) {
			cb.onclick = function() {
				onclick(cb);
			};
		}
		n.appendChild(CT.dom.label(lname || cbid, cbname, lclass));
		n.isChecked = function() {
			return cb.checked;
		};
		n.setChecked = function(val) {
			cb.checked = val;
			onclick && onclick(cb);
		};
		return n;
	},
	"checkStruct": function(struct, value, single, parent) {
		var name = struct.name || (struct.other && "Other") || struct;
		var cb = CT.dom.checkboxAndLabel(name, !!value, null, null, null, function(cbinput) {
			CT.log(name + ": " + cbinput.checked);
			if (cbinput.checked) {
				parent && parent.setChecked(true);
				single && CT.dom.each(cb.parentNode, function(sib) {
					(sib == cb) || sib.setChecked(false);
				});
			} else if (cb._subs)
				CT.dom.each(cb._subs, (s) => s.setChecked(false));
		}, CT.data.random(1000));
		cb._name = name;
		if (struct.other) {
			if (value)
				cb._name = value;
			cb._other = CT.dom.smartField({
				value: value,
				keyup: function(val) {
					cb._name = val || "Other";
				},
				onclick: () => cb.setChecked(true)
			});
			cb.appendChild(CT.dom.pad());
			cb.appendChild(cb._other);
		}
		if (struct.subs) {
			cb._subs = CT.dom.checkTree({
				structure: struct.subs,
				value: value,
				single: single,
				parent: cb
			});
			cb.appendChild(CT.dom.div(cb._subs, "tabbed"));
		}
		return cb;
	},
	"checkTree": function(opts) {
		var struct, vals = {}, snames = [], tree = CT.dom.div(opts.structure.map(function(s) {
			var oval, sname = s.name || s;
			snames.push(sname);
			if (opts.value) {
				if (s.other) {
					var sels = Object.keys(opts.value).filter(k => !snames.includes(k)).filter(k => opts.value[k]);
					oval = sels.length ? sels[0] : null; // max one in single mode
				} else
					oval = opts.value[sname];
			}
			return CT.dom.checkStruct(s, oval, opts.single, opts.parent);
		}));
		tree.value = function() {
			CT.dom.each(tree, function(sub) {
				if (sub.isChecked())
					vals[sub._name] = sub._subs ? sub._subs.value() : true;
				else
					vals[sub._name] = false;
			});
			return vals;
		};
		return tree;
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
	"radio": function(opts) {
		opts = CT.merge(opts, {
			options: [],
			fieldName: "radio" + CT.data.random(1000)
		});
		var n = CT.dom.div();
		n.value = function() {
			return n._val;
		};
		n.setVal = function(v) {
			n._val = v.name || v;
		};
		n.update = function(upts) {
			n.olist = Array.isArray(opts.options) && opts.options || opts.options(upts);
			CT.dom.setContent(n, CT.dom.options(n.olist, n.setVal, opts.value, opts.fieldName));
			opts.value && n.setVal(opts.value);
		};
		(Array.isArray(opts.options) && opts.options.length) && n.update();
		return n;
	},
	"bool": function(opts) {
		var n = CT.dom.radio(CT.merge(opts, {
			options: ["Yes", "No"]
		}));
		n.value = function() { // else undefined
			if (n._val == "Yes")
				return true;
			if (n._val == "No")
				return false;
		};
		return n;
	},
	"options": function(data, cb, selected, fieldName) {
		var otherSel = !data.map(d => d.name || d).includes(selected);
		return CT.dom.div(data.map(function(d, i) {
			var dname = d.name || (d.other && "Other") || d, fopts = {
				name: fieldName,
				onclick: function() {
					cb(d.other ? sf.fieldValue() : d);
					d.other && sf.focus();
				}
			}, fid = fieldName + "rs" + i + dname, fn, nz, sf;
			if (selected && ((selected == dname) || (selected == d.key) || (d.other && otherSel)))
				fopts.checked = true;
			fn = CT.dom.field(fid, null, null, "radio", fopts);
			nz = [ fn, CT.dom.label(dname, fid, null, null, d.hover) ];
			if (d.other) {
				sf = CT.dom.smartField({
					keyup: cb,
					value: otherSel && selected,
					onclick: () => fn.click()
				});
				nz.push(CT.dom.pad());
				nz.push(sf);
			}
			return nz;
		}));
	},
	"linkWithIcon": function(icon, lname, laddr, lonclick) {
		var n = CT.dom.node("", "span");
		n.appendChild(CT.dom.img(icon, "vmiddle rpaddedsmall nodecoration", lonclick, laddr));
		n.appendChild(CT.dom.link(lname, lonclick, laddr));
		return n;
	},
	"labeledImage": function(img, href, label, _alt, _icl, _wcl, _lcl, reverseNodes, onclick, sametarget, _id) {
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
		var w = CT.dom.node(nlink, "div", _wcl, _id);
		if (href) {
			nlink.href = href;
			if (!sametarget)
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
	"choices": function(nodes, multi, cellClass, selectedClass, onchange, stopProp, filter, fnode) {
		selectedClass = selectedClass || "grayback";
		var n = CT.dom.node();
		n._sel = null;
		n.value = multi ? [] : -1;
		if (filter)
			(fnode || n).appendChild(CT.dom.filter(nodes, null, null, typeof filter == "string" && filter));
		nodes.forEach(function(node, i) {
			node.onclick = function(e) {
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
				stopProp && e && e.stopPropagation();
			};
			node.classList.add(cellClass || "choice_cell");
			n.appendChild(node);
		});
		return n;
	},
	"updown": function() {
		var up = CT.dom.link("up", function() {
			var pnode = n.parentNode,
				psib = pnode.previousSibling;
			pnode.parentNode.insertBefore(pnode, psib);
			n.update();
			psib.firstChild.update();
		}, null, "block"), down = CT.dom.link("down", function() {
			var pnode = n.parentNode,
				nsib = pnode.nextSibling,
				nnsib = nsib.nextSibling;
			if (nnsib)
				pnode.parentNode.insertBefore(pnode, nnsib);
			else
				pnode.parentNode.appendChild(pnode);
			nsib.firstChild.update();
			n.update();
		}, null, "block"), n = CT.dom.div([up, down], "right small");
		n.update = function() {
			CT.dom[n.parentNode.previousSibling ? "show" : "hide"](up);
			CT.dom[n.parentNode.nextSibling ? "show" : "hide"](down);
		};
		setTimeout(n.update);
		return n;
	},
	"shuffler": function(data, rower) {
		rower = rower || function(d) {
			return d.label || d.name || d.title || d;
		};
		var n = CT.dom.div();
		data.forEach(function(d, i) {
			var row = CT.dom.div([
				CT.dom.updown(),
				rower(d)
			], "choice_cell");
			row.data = d;
			n.appendChild(row);
		});
		n.value = function() {
			return CT.dom.map(n, r => r.data);
		};
		return n;
	},
	"dragListing": function(d, rower) {
		var nid = "dli_" + (d.key || d.name || d || CT.data.random(1000)),
			n = rower ? rower(d) : CT.dom.div(d.name || d, "bordered padded margined round");
		n.id = nid;
		n.draggable = true;
		n.ondragstart = function(ev) {
			ev.dataTransfer.setData("text/plain", nid);
		};
		return n;
	},
	"dragList": function(data, rower, onchange, colattrs, colstyle, wrapperclass) {
		var pnode = CT.dom.div(data.map(d => CT.dom.dragListing(d, rower)), wrapperclass || "bordered", null, CT.merge({
			ondrop: function(ev) {
				var nodeId = ev.dataTransfer.getData("text/plain"),
					tar = ev.target, dnode = CT.dom.id(nodeId);
				while (pnode.contains(tar) && tar.parentNode != pnode)
					tar = tar.parentNode;
				if (!((tar.parentNode == pnode) && dnode.parentNode == pnode))
					return CT.log("missed drop");
				pnode.insertBefore(dnode, tar);
				pnode.data = CT.dom.map(pnode, d => d.id.slice(4));
				ev.preventDefault();
				onchange && onchange(pnode.data);
			},
			ondragover: function(ev) {
				ev.dataTransfer.dropEffect = "move";
				ev.preventDefault();
			}
		}, colattrs), colstyle);
		pnode.data = data.map(d => d.key || d);
		return pnode;
	},
	"dragListList": function(data, rower, colattrs, colstyle, dataer, onchange) {
		var pnode = CT.dom.flex(data.map(d => CT.dom.dragList(d, rower, onchange, colattrs, colstyle)), "row");
		pnode.value = function() {
			return CT.dom.map(pnode, dataer || (n => n.data));
		};
		return pnode;
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
	"timeSelector": function(etimes, curvalue, onchange) {
		etimes = etimes || [];
		for (var i = 0; i < 24; i++) {
			var istr = i < 10 ? "0" + i : i;
			etimes.push(istr + ":" + "00");
			etimes.push(istr + ":" + "30");
		}
		return CT.dom.select(etimes, null, null,
			curvalue, null, onchange, null, true);
	},
	"dateSelectors": function(node, d, startdate, enddate, withtime, noday, val) {
		if (arguments.length == 1 && ! (arguments[0] instanceof Node)) {
			var obj = arguments[0];
			node = obj.node;
			d = obj.d;
			startdate = obj.startdate;
			enddate = obj.enddate;
			withtime = obj.withtime;
			noday = obj.noday;
			val = obj.val;
		}
		var eyears = ["Year"];
		startdate = startdate || CT.dom.currentyear;
		enddate = enddate || CT.dom.currentyear;
		if (startdate == enddate)
			enddate += 1;
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
			d.time = CT.dom.timeSelector(["Time"]);
			node.appendChild(d.time);
		}
		if (val) {
			var vsplit = val.split(" "),
				dsplit = vsplit[0].split("-");
			d.year.value = dsplit[0];
			d.month.value = dsplit[1];
			if (!noday)
				d.day.value = dsplit[2];
			if (withtime) {
				var t = vsplit[1].slice(0, -3);
				d.time.value = t;
				if (t && d.time.value != t) { // no option yet
					d.time.insertBefore(CT.dom.node(t, "option"), d.time.firstChild.nextSibling);
					d.time.value = t;
				}
			}
		}
		d.value = function() {
			if (d.year.value == "Year" || d.month.value == "Month" || (!noday && d.day.value == "Day"))
				return null;
			var val = d.year.value + "-" + d.month.value;
			if (!noday)
				val += "-" + d.day.value;
			if (withtime)
				val += " " + (d.time.value || "00:00") + ":00";
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
		var field = CT.dom.id(fieldId) || fieldId;
		if (!field)
			return null;
		if (fieldPath) {
			for (var i = 0; i < fieldPath.length; i++)
				field = field[fieldPath[i]];
		}
		var s = field.container ? field.container.value() : field.value,
			blurs = CT.dom._blurs[fieldId] || field._blurs;
		if (!s || (blurs && blurs.indexOf(s) != -1))
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
		useblurs = CT.dom._blurs[field.id] = field._blurs = useblurs
			|| CT.dom._blurs[field.id] || field._blurs;
		var pw = field.type == "password";
		if (useblurs) {
			field.onblur = function() {
				if (field.value == "") {
					if (pw)
						field.type = "";
					field.classList.add("gray");
					field.value = useblurs[Math.floor(Math.random() * useblurs.length)];
				}
				else
					field.classList.remove("gray");
			};
			field.onfocus = function() {
				if (useblurs.indexOf(field.value) != -1) {
					field.value = "";
					if (pw)
						field.type = "password";
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
	"inputEnterCallback": function(n, cb, fid, noBreak, keyup, onclick) {
		n.onenter = function(e) {
			if (noBreak)
				n.value = n.value.replace("\n", "").replace("\r", "");
			// can prevent annoying repeating alert on enter scenarios
			if (fid)
				document.getElementById(fid).focus();
			if (cb && (cb(n.value, e) == "clear"))
				n.value = "";
		};
		n.addEventListener("keyup", function(e) {
			e = e || window.event;
			var code = e.keyCode || e.which;
			keyup && keyup(n.value);
			if (code == 13 || code == 3)
				n.onenter(e);
		});
		onclick && n.addEventListener("click", onclick);
		return n;
	},
	"smartField": function(cb, classname, id, value, type, blurs, isTA, noBreak, wyz, keyup, placeholder, onclick) {
		if (arguments.length == 1 && typeof arguments[0] != "function") {
			var obj = arguments[0];
			cb = obj.cb;
			classname = obj.classname;
			id = obj.id;
			value = obj.value;
			type = obj.type;
			blurs = obj.blurs;
			isTA = obj.isTA;
			noBreak = obj.noBreak;
			wyz = obj.wyz;
			keyup = obj.keyup;
			placeholder = obj.placeholder;
			onclick = obj.onclick;
		}
		var f, dw, nonbsp, restricted, tables, spellcheck, fullscreen, charmap;
		if (wyz && wyz.includes) {
			nonbsp = wyz.includes("nonbsp");
			restricted = wyz.includes("restricted");
			tables = wyz.includes("tables");
			spellcheck = wyz.includes("spellcheck");
			fullscreen = wyz.includes("fullscreen");
			charmap = wyz.includes("charmap");
		}
		id = id || ("sf" + Math.floor((Math.random() * 100000)));
		if (keyup == "dynwidth") {
			dw = true;
			keyup = function() {
				f.style.width = (f.value.length * 16) + "px";
			};
		}
		f = CT.dom.inputEnterCallback(CT.dom[isTA ? "textArea" : "field"](id,
			value, classname, type), cb, id, noBreak, keyup, onclick);
		if (placeholder)
			f.placeholder = placeholder;
		f.fieldValue = function() { // accounts for blur
			return wyz ? f.get(nonbsp) : CT.dom.getFieldValue(f);
		};
		wyz && CT.rte.qwiz(id, value, !restricted, tables, spellcheck, fullscreen, charmap);
		if (blurs)
			CT.dom.blurField(f, blurs);
		dw && keyup();
		return f;
	},

	"numberSelector": function(o) {
		var initial = o.initial || 1, shower = CT.dom.div(initial),
			r = CT.dom.range(function(val) {
				CT.dom.setContent(shower, val);
			}, o.min || 0.25, o.max || 5, initial, o.step || 0.25,
				o.classname, o.id, o.onchange),
			n = CT.dom.div([shower, r]);
		n.value = function() {
			return window["parse" + ((o.step == 1) ? "Int" : "Float")](r.value);
		};
		return n;

	},

	"iconSelector": function(items, selectFirst) {
		var cur, n = CT.dom.div(items.map(function(i) {
			var img = CT.dom.img(i.img || i.url || i.item || i, "padded margined round", function() {
				if (cur)
					cur.firstChild.classList.remove("bordered");
				cur = img;
				cur.firstChild.classList.add("bordered");
			});
			img._icon = i;
			return img;
		}));
		n.value = function() {
			return cur && cur._icon;
		};
		selectFirst && n.firstChild.onclick();
		return n;
	},

	"soundSelector": function(items, selectFirst) {
		var cur, n = CT.dom.div(items.map(function(aud) {
			var src = aud.src || aud.item, wrap = CT.dom.div([
				aud.label || aud.name,
				CT.dom.audio({
					src: src,
					controls: true,
					className: "w1"
				})
			], "pointer padded margined round", null, {
				onclick: function() {
					if (cur)
						cur.classList.remove("bordered");
					cur = wrap;
					cur.classList.add("bordered");
				}
			});
			wrap._data = aud;
			return wrap;
		}));
		n.value = function() {
			return cur && cur._data;
		};
		selectFirst && n.firstChild.onclick();
		return n;
	},

	"filter": function(nodes, placeholder, showDisplay, className) {
		var refresher = function(val) {
			var refitem = function(n, i) {
				CT.dom[(!val || (n.firstElementChild || n).innerHTML.toLowerCase().includes(val.toLowerCase())) ? "show" : "hide"](n, showDisplay);
			};
			if (Array.isArray(nodes))
				nodes.forEach(refitem);
			else
				CT.dom.each(nodes, refitem);
			clearbutt.style.display = val ? "inline" : "none";
		}, sf = CT.dom.smartField({
			keyup: refresher,
			placeholder: placeholder
		}), clearbutt = CT.dom.span("X", "hidden pointer");
		clearbutt.onclick = function() {
			sf.value = "";
			refresher();
		}
		return CT.dom.span([sf, clearbutt], className);
	},

	// resizers
	"_isVerticalOrientation": function(node) {
		if (node.clientHeight == 0 || node.clientWidth == 0)
			return undefined;
		return node.clientWidth / node.parentNode.clientWidth
			< node.clientHeight / node.parentNode.clientHeight;
	},
	"cover": function(node) {
		var v = CT.dom._isVerticalOrientation(node);
		if (v == undefined)
			return v;
		node.classList.add(v ? "w1" : "h1");
		node.classList.remove(v ? "h1" : "w1");
		return v;
	},
	"contain": function(node) {
		var v = CT.dom._isVerticalOrientation(node);
		if (v == undefined)
			return v;
		node.classList.add(v ? "h1" : "w1");
		node.classList.remove(v ? "w1" : "h1");
		return v;
	},
	"fit": function(node) {
		node.fit = function() {
			if (node.scrollHeight != node.clientHeight) {
				var size = parseInt(getComputedStyle(node).fontSize);
				node.style.fontSize = (size - 1) + "px";
				setTimeout(node.fit);
			}
		};
		CT.onresize(node.fit);
	},

	// rich input stuff
	"_ricounter": 0,
	"_get_ta_id": function() {
		var taid = "richinput" + CT.dom._ricounter;
		CT.dom._ricounter += 1;
		return taid;
	},
	"richInput": function(inputnode, taid, submitbutton, content, charlimit, blurs, noclear, taclass) {
		taid = taid || CT.dom._get_ta_id();
		charlimit = charlimit || 500;
		var cbody = CT.dom.textArea(taid, content, taclass || "fullwidth");
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
	"showHideV": function(n, juston, justoff) {
		n = n || document.body;
		if (juston)
			n.style.visibility = "visible";
		else if (justoff)
			n.style.visibility = "hidden";
		else
			n.style.visibility = n.style.visibility == "visible" && "hidden" || "visible";
	},
	"showHide": function(n, juston, justoff, dstyle) {
		n = n || document.body;
		if (typeof n == "string")
			n = CT.dom.id(n);
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
	"showV": function(n) {
		CT.dom.showHideV(n, true);
	},
	"hideV": function(n) {
		CT.dom.showHideV(n, false, true);
	},
	"remove": function(n) {
		if (!n) return;
		if (typeof n == "string") n = CT.dom.id(n);
		n && n.parentNode && n.parentNode.removeChild(n);
	},
	"replace": function(target, replacement) {
		if (typeof target == "string")
			target = CT.dom.id(target);
		if (typeof replacement == "string")
			replacement = CT.dom.div(replacement);
		if (target.parentNode) {
			target.parentNode.insertBefore(replacement, target);
			target.parentNode.removeChild(target);
		}
	},
	"clear": function(n) {
		if (typeof n == "string")
			n = CT.dom.id(n);
		(n || document.body).innerHTML = "";
	},
	"addContent": function(targetNode, content, withClass) {
		if (typeof content == "function")
			content = content();
		if (Array.isArray(content))
			content = CT.dom.div(content, withClass);
		if (typeof targetNode == "string")
			targetNode = CT.dom.id(targetNode, true);
		if (typeof content == "string" || typeof content == "number")
			targetNode.innerHTML += content;
		else if (content)
			targetNode.appendChild(content);
	},
	"setContent": function(targetNode, content, withClass) {
		CT.dom.clear(targetNode);
		CT.dom.addContent(targetNode, content, withClass);
	},
	"setMain": function(content) {
		CT.dom.setContent("ctmain", content);
	},
	"setBody": function(content) {
		CT.dom.setContent(document.body, content);
	},
	"addEach": function(parent, subs) {
		subs.forEach(function(node) { // must wrap
			parent.appendChild(node);
		});
	},

	// ALLNODE stuff
	"ALLNODE": null,
	"loadAllNode": function(fallBackToBody) {
		if (!CT.dom.ALLNODE) {
			ALLNODE = CT.dom.ALLNODE = document.getElementById("all") || (fallBackToBody && document.body);
			CT.dom.ALLNODE._mobile = CT.align.width() <= 720;
			window.onresize = function() {
				CT.dom.ALLNODE.resize && CT.dom.ALLNODE.resize();
				CT.align.resize();
			};
		}
	},
	"getAllNode": function(fallBackToBody) {
		CT.dom.loadAllNode(fallBackToBody);
		return CT.dom.ALLNODE;
	},
	"showAllNode": function() {
		var _a = CT.dom.ALLNODE;
		_a.style.opacity = _a.style["-moz-opacity"] = _a.style["-khtml-opacity"] = "1";
		_a.style.filter = "alpha(opacity = 100)";
		_a.style["-ms-filter"] = "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
	},
	"onAllNode": function(cb, noBodyFallback) {
		if (!document.body)
			return setTimeout(() => CT.dom.onAllNode(cb, noBodyFallback), 100);
		cb(CT.dom.getAllNode(!noBodyFallback));
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
			{ "href": href, "rel": "stylesheet" }) : CT.dom.node(text, "style");
		CT.dom.head(node);
	},

	// defer function until node exists in dom
	"doWhenNodeExists": function(id, cb) {
		var n = CT.dom.id(id);
		if (n)
			return cb(n);
		setTimeout(CT.dom.doWhenNodeExists, 500, id, cb);
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
	"attr": function(key, val, first) {
		var r = CT.dom.Q("[" + (val ? (key + '="' + val + '"') : key) + "]");
		return first ? r[0] : r;
	},
	"Q": function(q, n) {
		return CT.dom._narr2arr((n || document.body).querySelectorAll(q));
	},
	"head": function(node) {
		var head = CT.dom.tag("head")[0];
		if (node)
			head.appendChild(node);
		return head;
	},
	"meta": function(name, content) {
		var meta = CT.dom.node(null, "meta");
		meta.name = name;
		meta.content = content;
		CT.dom.head(meta);
	},
	"each": function(p, f) {
		for (var i = 0; i < p.childNodes.length; i++)
			f(p.childNodes[i], i);
	},
	"map": function(p, f) {
		var vals = [], i;
		f = f || function(i) { return i; };
		for (i = 0; i < p.childNodes.length; i++)
			vals.push(f(p.childNodes[i]));
		return vals;
	},
	"childNum": function(n) {
		return CT.dom.map(n.parentNode).indexOf(n);
	},
	"mod": function(opts) {
		var targets = opts.targets ? opts.targets
			: (opts.target ? [opts.target]
			: (opts.className ? CT.dom.className(opts.className)
			: (opts.id ? [CT.dom.id(opts.id)] : []))),
			property = opts.property || "display",
			value = opts.value ||
				(opts.show ? "block" : opts.hide ? "none" : ""),
			modz = opts.modz;
		if (!modz) {
			modz = {};
			modz[property] = value;
		}
		Object.keys(modz).forEach(function(property) {
			for (var i = 0; i < targets.length; i++)
				targets[i].style[property] = modz[property];
		});
	}
};
