/*****
 * cantools.js
 * version 0.1.13
 * MIT License:

Copyright (c) 2011 Civil Action Network

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *****/

/****
 * JSON. If you've got a better wire protocol, I'd love to hear it.
 ****/
if(!this.JSON){JSON={}}(function(){function f(n){return n<10?'0'+n:n}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z'};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key)}if(typeof rep==='function'){value=rep.call(holder,key,value)}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null'}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null'}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v)}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' '}}else if(typeof space==='string'){indent=space}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}return str('',{'':value})}}if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j}throw new SyntaxError('JSON.parse');}}}());

/****
 * Util code.
 ****/

/****
 * Fix for IE's broken indexOf
 * http://soledadpenades.com/2007/05/17/arrayindexof-in-internet-explorer/
 ****/
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    }
}

/****
 * Fix for IE's broken document.getElementsByClassName
 * http://groups.google.com/group/rubyonrails-spinoffs/browse_thread/thread/c0a4ae87cba265f7/d78509661cd1d400
 ****/
if (!document.getElementsByClassName) {
    document.getElementsByClassName = function(className, parentElement) {
      if (typeof parentElement == 'string'){
        parentElement = document.getElementById(parentElement);
      } else if (typeof parentElement != 'object' ||
                typeof parentElement.tagName != 'string'){
        parentElement = document.body;
      }
      var children = parentElement.getElementsByTagName('*');
      var re = new RegExp('\\b' + className + '\\b');
      var el, elements = [];
      var i = 0;
      while ( (el = children[i++]) ){
        if ( el.className && re.test(el.className)){
          elements.push(el);
        }
      }
      return elements;
    }
}

/****
 * Fix for IE's broken String.trim
 * http://stackoverflow.com/questions/2308134/trim-in-javascript-not-working-in-ie
 ****/
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

// original: http://msdn.microsoft.com/en-us/library/ms537509%28v=vs.85%29.aspx
//  - removed appName check, which doesn't detect IE-based AOL Explorer
//  - added Opera check, since Opera sometimes thinks it's IE
//  - removed regular expression, which interfered with compilation
//  - in other words, we've rewritten the entire function. thank you microsoft.
var getInternetExplorerVersion = function() {
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
//    var rv = -1; // Return value assumes failure.
//    if (navigator.appName == 'Microsoft Internet Explorer') {
    var ua = navigator.userAgent;
    if (ua.indexOf("Opera") == -1) {
        var parts = ua.split("MSIE ");
        if (parts.length > 1)
            return parseFloat(parts[1].split(";")[0]);
//        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
//        if (re.exec(ua) != null)
//            rv = parseFloat(RegExp.$1);
    }
    return -1;
//    return rv;
};

// absolute position finder
// from: http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    return [curleft,curtop];
}

var newNode = function(content, type, classname, id, attrs) {
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
//    for (var attr in attrs)
  //      d[attr] = attrs[attr];
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
};

var blurs = {};
var setBlur = function(fieldId, values) {
    blurs[fieldId] = values;
};
var getFieldValue = function(fieldId, fieldPath, rules) {
    var field = document.getElementById(fieldId);
    if (!field)
        return null;
    if (fieldPath) {
        for (var i = 0; i < fieldPath.length; i++)
            field = field[fieldPath[i]];
    }
    var s = field.value;
    if (s == "" || (blurs[fieldId] && blurs[fieldId].indexOf(s) != -1))
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
};
var blurField = function(field, useblurs) {
    useblurs = blurs[field.id] = useblurs || blurs[field.id];
    if (useblurs) {
        field.onblur = function() {
            if (field.value == "") {
                field.className += " gray";
                field.value = useblurs[Math.floor(Math.random()*useblurs.length)];
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
};
var setFieldValue = function(value, fieldId, fieldPath) {
    var field = document.getElementById(fieldId);
    if (fieldPath) {
        for (var i = 0; i < fieldPath.length; i++)
            field = field[fieldPath[i]];
    }
    field.value = value || "";
    blurField(field);
};

var ALLNODE = null;
var loadAllNode = function() {
    if (!ALLNODE)
        ALLNODE = document.getElementById("all");
};
var getAllNode = function() {
    loadAllNode();
    return ALLNODE;
};
var absers = [];
var allLeft = function() {
    // accounts for padding
    loadAllNode();
    return ALLNODE.offsetLeft + 8;
};
var absed = function(node, leftpx, toppx) {
    node.style.position = "absolute";
    node.style.left = (leftpx + allLeft()) + "px";
    if (toppx != null)
        node.style.top = toppx + "px";
    absers.push([node, leftpx]);
    return node;
};
var windowHeight = function() {
    return window.innerHeight || document.body.clientHeight;
};
var windowWidth = function() {
    return window.innerWidth || document.body.clientWidth;
};
var fullscreeners = [];
var screenheight = function(node) {
    node.style.height = (windowHeight() - 50) + "px";
    if (fullscreeners.indexOf(node) == -1)
        fullscreeners.push(node);
    return node;
};
var centerscreeners = [];
var centernode = function(n) {
    if (n.scrollHeight) {
        n.origScrollHeight = n.origScrollHeight || n.scrollHeight;
        var parentHeight = windowHeight();
        var paddedHeight = parentHeight - 100;
        var nodeHeight = parseInt(n.style.height) || n.origScrollHeight;
        if (nodeHeight > paddedHeight || nodeHeight < n.origScrollHeight) {
            nodeHeight = Math.min(n.origScrollHeight, paddedHeight);
            n.style.height = nodeHeight + "px";
        }
        n.style.top = (parentHeight - nodeHeight)/2 + "px";
        n.style.left = (windowWidth()/2) - (n.clientWidth/2) + "px";
    }
};
var centered = function(n) {
    n.style.position = "fixed";
    centernode(n);
    if (centerscreeners.indexOf(n) == -1)
        centerscreeners.push(n);
    return n;
};
var centerall = function() {
    for (var i = 0; i < centerscreeners.length; i++)
        centernode(centerscreeners[i]);
};
window.onresize = function() {
    loadAllNode();
    if (!ALLNODE) {
        window.onresize = {};
        return;
    }
    var offset = allLeft();
    for (var i = 0; i < absers.length; i++)
        absers[i][0].style.left = (absers[i][1] + offset) + "px";
    for (var i = 0; i < fullscreeners.length; i++)
        fullscreeners[i].style.height = (windowHeight() - 50) + "px";
    centerall();
};
setInterval(centerall, 1000);
var newLink = function(content, onclick, href, classname, id, attrs, newtab) {
    if (attrs == null)
        attrs = {};
    if (onclick)
        attrs.onclick = onclick;
    if (href)
        attrs.href = href;
    if (newtab)
        attrs.target = "_blank";
    return newNode(content, "a", classname, id, attrs);
};
var newButton = function(content, onclick, classname, id) {
    return newNode(content, "button", classname, id, {"onclick": onclick});
};
var newField = function(id, value, classname, type) {
    return newNode("", "input", classname, id, (value!=null || type!=null) && {"value": value, "type": type} || null);
};
var labelAndField = function(lname, fid, fclass, lclass, fval, ista, isresize) {
    fid = fid || lname.replace(/ /g, "");
    var n = newNode();
    var finput = (ista && newTA || newField)(fid,
        fval, "right "+(fclass||""),
        (lname.indexOf("Password") != -1) && "password" || null);
    if (ista && isresize) {
        finput.onkeyup = function() {
            resizeTextArea(finput);
            return true;
        };
    }
    n.appendChild(finput);
    n.appendChild(newNode(lname, "label", lclass,
        null, {"for": fid, "htmlFor": fid}));
    n.appendChild(newNode("", "div", "clearnode"));
    return n;
}
var newSelect = function(onames, ovalues, id, curvalue, defaultvalue) {
    ovalues = ovalues || onames;
    var s = newNode("", "select", "", id);
    for (var i = 0; i < onames.length; i++) {
        s.appendChild(newNode(onames[i], "option",
            "", "", {"value": ovalues[i]}));
    }
    if (curvalue)
        s.value = ovalues.indexOf(curvalue) != -1 && curvalue || defaultvalue;
    return s;
};
var monthnames = ["January", "February",
    "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December"];
var month2num = function(month) {
    return monthnames.indexOf(month)+1; // for "Month" at top of select
};
var currentyear = Math.max((new Date()).getFullYear(), 2014);
var dateSelectors = function(node, d, startdate, enddate, withtime, noday) {
    var eyears = ["Year"];
    startdate = startdate || currentyear;
    enddate = enddate || currentyear;
    for (var i = startdate; i <= enddate; i++)
        eyears.push(i);
    d.year = newSelect(eyears);
    d.month = newSelect(["Month"].concat(monthnames),
        ["Month", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    node.appendChild(d.year);
    node.appendChild(d.month);
    if (!noday) {
        d.day = newSelect(["Day", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
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
        d.time = newSelect(etimes);
        node.appendChild(d.time);
    }
};
var radioStripStep = function(radios, labels, lname, cb, stripname, stripnum, ison) {
    var fname = (stripname || "radiostrip") + (stripnum || "") + lname;
    var f = newField(fname, null, null, "radio");
    f.name = (stripname||"")+(stripnum||"");
    f.onclick = function() {
        cb(lname);
    };
    if (ison)
        f.checked = true;
    radios.insertCell(-1).appendChild(f);
    labels.insertCell(-1).appendChild(newNode(lname,
        "label", null, null,
        {"htmlFor": fname, "for": fname}));
};
var capitalize = function(word) {
    return word.slice(0,1).toUpperCase() + word.slice(1);
};
var toCaps = function(lowers) {
    var uppers = [];
    for (var i = 0; i < lowers.length; i++)
        uppers.push(capitalize(lowers[i]));
    return uppers;
};
var key2title = function(k) {
    return toCaps(k.split("_")).join(" ");
};
var words2title = function(k) {
    return toCaps(k.split(" ")).join(" ");
};
var keys2titles = function(lowers) {
    var uppers = [];
    for (var i = 0; i < lowers.length; i++)
        uppers.push(key2title(lowers[i]));
    return uppers;
};
var genfield = function(ftype, n, d, u, val, node2) {
    var f = newField("up"+ftype, val || u[ftype],
        "right w280", (ftype.indexOf("password") != -1) && "password" || null);
    d[ftype] = f;
    n.appendChild(f);
    n.appendChild(newNode(key2title(ftype), "label", "bold",
        null, {"for": "up"+ftype, "htmlFor": "up"+ftype}));
    if (node2) {
        n.appendChild(newNode("&nbsp;&nbsp;", "span"));
        n.appendChild(node2);
    }
    n.appendChild(newNode("", "div", "clearnode"));
};
var radioStrip = function(pnode, lnames, cb, stripname, stripnum, stripval) {
    var rtable = newNode("", "table");
    rtable.style.textAlign = "center";
    var radios = rtable.insertRow(0);
    var labels = rtable.insertRow(1);
    for (var i = 0; i < lnames.length; i++)
        radioStripStep(radios, labels, lnames[i], cb, stripname, stripnum, lnames[i] == stripval);
    pnode.appendChild(rtable);
};
var newTA = function(id, value, classname) {
    return newNode("", "textarea", classname, id, value && {"value": value} || null);
};
var newImg = function(imgsrc, imgclass, onclick, _href, _target, _title, _linkid) {
    var n = newNode("", "img", imgclass, "", {"src": imgsrc});
    if (onclick || _href) {
        var l = newLink("", onclick, _href);
        if (_target)
            l.target = _target;
        if (_title)
            l.title = l.alt = _title;
        if (_linkid)
            l.id = _linkid;
        l.appendChild(n);
        return l;
    }
    return n;
};
var linkWithIcon = function(icon, lname, laddr, lonclick) {
    var n = newNode("", "span");
    n.appendChild(newImg(icon, "vmiddle rpaddedsmall nodecoration", lonclick, laddr));
    n.appendChild(newLink(lname, lonclick, laddr));
    return n;
};
var wrapped = function(nodes, type, className, id, attrs) {
    var wrapper = newNode("", type, className, id, attrs);
    if (!Array.isArray(nodes))
        nodes = [nodes];
    for (var i = 0; i < nodes.length; i++)
        wrapper.appendChild(nodes[i]);
    return wrapper;
};
var validEmail = function(s) {
    var atChar = s.indexOf('@');
    var dotChar = s.indexOf('.', atChar);
    if (atChar == -1 || dotChar == -1 || atChar > dotChar)
        return false;
    return true;
};
var validPassword = function(s) {
    return s && s.length > 5;
};
var listRemove = function(oldlist, element) {
    var newlist = [];
    for (var i = 0; i < oldlist.length; i++) {
        if (oldlist[i] != element)
            newlist.push(oldlist[i]);
    }
    return newlist;
};
var _NUMS = '0123456789';
var stripToNums = function(s) {
    s = s || "";
    var newStr = '';
    for (var i = 0; i < s.length; i++) {
        if (_NUMS.indexOf(s.charAt(i)) != -1)
            newStr += s.charAt(i);
    }
    return newStr;
};
var stripToPhone = function(s) {
    var newStr = stripToNums(s);
    if (newStr.length < 10)
        return "";
    return newStr.slice(0,10);
};
var stripToZip = function(s) {
    var newStr = stripToNums(s);
    if (newStr.length < 5)
        return "";
    return newStr.slice(0,5);
};
var checkBoxAndLabel = function(cbid, ischecked, lname, lclass, cclass, onclick) {
    var n = newNode("", "div", cclass);
    var cbname = cbid+"checkbox";
    var cbdata = {"type": "checkbox"};
    if (ischecked)
        cbdata.checked = ischecked;
    var cb = newNode("", "input", "", cbname, cbdata);
    n.appendChild(cb);
    if (onclick) {
        cb.onclick = function() {
            onclick(cb);
        };
    }
    n.appendChild(newNode(lname || cbid, "label", lclass, "",
        {"for": cbname, "htmlFor": cbname}));
    return n;
};
var inputEnterCallback = function(n, cb, fid) {
    n.onkeyup = function(e) {
        e = e || window.event;
        var code = e.keyCode || e.which;
        if (code == 13 || code == 3) {
            // can prevent annoying repeating alert on enter scenarios
            if (fid)
                document.getElementById(fid).focus();
            cb();
        }
    };
};
var _pwpcb = null;
var passwordPrompt = function(cb) {
    _pwpcb = cb;
    var pwprompt = document.getElementById("passwordprompt");
    var pwpfield = document.getElementById("pwpfield");
    if (pwprompt == null) {
        pwprompt = newNode("", "div", "hidden basicpopup centered", "passwordprompt");
        document.body.appendChild(pwprompt);
        pwprompt.appendChild(newNode("For your own security, please enter your password.", "div", "bottompadded"));
        pwpfield = newField("pwpfield", null, null, "password");
        pwprompt.appendChild(pwpfield);
        var entercb = function() {
            if (! validPassword(pwpfield.value))
                return alert("invalid password!");
            pwprompt.style.display = "none";
            _pwpcb(pwpfield.value);
        };
        inputEnterCallback(pwpfield, entercb);
        pwprompt.appendChild(newButton("Continue", entercb));
        pwprompt.appendChild(newButton("Cancel", function() {
            pwprompt.style.display = "none";
        }));
    }
    pwpfield.value = "";
    pwprompt.style.display = "block";
    pwpfield.focus();
    centered(pwprompt);
};
var processPostParams = function(x) {
    // overwrite this function to add encryption (for example)
    return JSON.stringify(x);
};
var _xhr = function () {
    return window.XMLHttpRequest ? new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");
};
var ENCODE = false;
var postData = function(path, params, errMsg, cb, eb, cbarg, ebarg) {
    var xhr = _xhr();
    xhr.open("POST", path, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var data = xhr.responseText;
                if (ENCODE)
                    data = flipSafe(data);
                if (data.charAt(0) == '0') {
                    if (eb) eb(data.slice(1), ebarg);
                    else alert(errMsg+": "+data.slice(1));
                }
                else if (cb != null)
                    cb(eval("("+data.slice(1)+")"), cbarg);
            }
            else if (!ENCODE)
                alert("request to "+path+" failed!");
        }
    }
    xhr.send(processPostParams(params));
};
var sameList = function(list1, list2) {
    if (list1.length != list2.length)
        return false;
    for (var i = 0; i < list1.length; i++) {
        if (list1[i] != list2[i])
            return false;
    }
    return true;
};
var copyList = function(oldlist) {
    var newlist = [];
    for (var i = 0; i < oldlist.length; i++)
        newlist.push(oldlist[i]);
    return newlist;
};
var dataDiff = function(dold, dnew, required, compdicts, submap, complists) {
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
};
var datamap = {};
var newData = function(d) {
    if (datamap[d.key]) {
        for (var k in d)
            datamap[d.key][k] = d[k];
    }
    else
        datamap[d.key] = d;
};
var newDataSet = function(dlist) {
    for (var i = 0; i < dlist.length; i++)
        newData(dlist[i]);
};
var uniquify = function(items, exceptions) {
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
};
var showHideT = function(n) {
    n.style.opacity = n.style.opacity == "1" && "0" || "1";
};
var showHide = function(n, juston, justoff, dstyle) {
    dstyle = dstyle || "block";
    if (juston || justoff)
        n.style.display = juston && dstyle || "none";
    else if (n.style.display == "" && n.className.indexOf("hidden") == -1)
        n.style.display = "none";
    else
        n.style.display = (n.style.display == dstyle) && "none" || dstyle;
};
var labeledImage = function(img, href, label, _alt, _icl, _wcl, _lcl) {
    var nlink = newLink();
    nlink.appendChild(newImg(img, _icl));
    nlink.appendChild(newNode(label, "div", _lcl));
    nlink.href = href;
    nlink.target = "_blank";
    nlink.title = nlink.alt = _alt || label;
    var wclass = "lfloat";
    if (_wcl)
        wclass += " "+_wcl;
    return wrapped(nlink, "div", wclass);
};
var breakurl = function(url) {
    return url.replace(/&/g, "&&#8203;").replace(/\//g, "/&#8203;").replace(/_/g, "_&#8203;");
};
var url2link = function(rurl, rname) {
    var furl = rurl;
    if (furl.slice(0,7) == "http://")
        rurl = rurl.slice(7);
    else if (furl.slice(0,8) == "https://")
        rurl = rurl.slice(8);
    else
        furl = "http://" + furl;
    return "<a href='"+ furl + "'>" + (rname || breakurl(rurl)) + "</a>";
};
var imgTypes = [
    ".gif",
    ".jpg",
    ".png"
];
var linkProcessor; // for compilation
var processLink = function(url) {
    var extpos = url.length - 4;
    for (var i = 0; i < imgTypes.length; i++)
        if (url.indexOf(imgTypes[i]) == extpos)
            return '<img src="' + url + '">';;
    return linkProcessor && linkProcessor(url) || url2link(url);
};
var processComment = function(c) {
    if (!c) return "";
    var clist = c.replace(new RegExp(String.fromCharCode(10), 'g'), ' ')
        .replace(new RegExp(String.fromCharCode(13), 'g'), ' ')
        .replace(/  /g, ' ').split(" ");
    for (var i = 0; i < clist.length; i++) {
        var w = clist[i];
        var fci = w.indexOf("http://");
        if (fci == -1)
            fci = w.indexOf("https://");
        if (fci != -1 && w[fci-1] != '"') {
            var frontCap = w.slice(0, fci);
            w = w.slice(fci);
            var endCap = "";
            var eci = w.indexOf('<');
            if (eci != -1) {
                endCap = w.slice(eci);
                w = w.slice(0, eci);
            }
            var lc = w.charAt(w.length-1);
            if (['.', ',', ':', ';', ')'].indexOf(lc) != -1)
                w = w.slice(0, w.length-1);
            else
                lc = "";
            clist[i] = frontCap + processLink(w) + lc + endCap;
        }
    }
    return clist.join(" ");
};

// wysiwyg editor widget
var wysiwygize = function(nodeid, isrestricted, val, cb) {
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
    n.get = function(stripnbsp) {
        var c = n.node.getContent();
        if (stripnbsp) while (c.slice(-6) == "&nbsp;")
            c = c.slice(0, -6);
        return c;
    };
    n.dothis = function(f) {
        if (!n.node) {
            n.node = tinyMCE.get(nodeid);
            if (!n.node)
                return setTimeout(n.dothis, 200, f);
        }
        (f||(function(){}))();
    };
    n.set = function(s) {
        n.dothis(function() { n.node.setContent(s); });
    };
    n.dothis(function() {
        val && n.set(val);
        cb && cb();
    });
};
var qwiz = function(nodeid, val) {
    var n = document.getElementById(nodeid);
    if (!n || n.get)
        return setTimeout(qwiz, 500, nodeid, val);
    !n.get && wysiwygize(nodeid, true, val);
};
var sanitize = function(b) {
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
};
var resizeTextArea = function(cbody) {
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
};

// info bubbles
var infoBubble, bubbleBounds;
var setInfoBubble = function(n, content) {
    if (!infoBubble) {
        infoBubble = newNode("hello there", "div", "small infobubble");
        ALLNODE.appendChild(infoBubble);
        var allpos = findPos(ALLNODE);
        bubbleBounds = {
            'left': allpos[0],
            'top': allpos[1]
        };
    }
    var npos;
    n.onmouseover = function(e) {
        if (n.nodeName == "A") // contains image
            n = n.firstChild;
        if (!npos)
            npos = findPos(n);
        infoBubble.innerHTML = content;
        showHide(infoBubble, true);
        bubbleBounds.right = bubbleBounds.left + ALLNODE.clientWidth - infoBubble.clientWidth;
        bubbleBounds.bottom = bubbleBounds.top + ALLNODE.clientHeight - infoBubble.clientHeight;
        infoBubble.style.left = Math.min(bubbleBounds.right - 10,
            Math.max(bubbleBounds.left + 10,
            npos[0] - (infoBubble.clientWidth - n.clientWidth) / 2)) + "px";
        infoBubble.style.top = Math.min(bubbleBounds.bottom - 10,
            Math.max(bubbleBounds.top + 10,
            npos[1] + n.clientHeight + 10)) + "px";
    };
    n.onmouseout = function() {
        showHide(infoBubble, false, true);
    };
    return n;
};