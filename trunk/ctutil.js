/*****
 * ctutil.js
 * version 0.1.15
 * MIT License:

Copyright (c) 2011 Civil Action Network

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *****/

// category sorting widget
var catlist, catheading, catcollection, gettingcats;
var catcbs = [];
var hideAllCategoriedBoxes = function() {
    var closethese = document.getElementsByClassName("categoriedbox");
    for (var i = 0; i < closethese.length; i++)
        closethese[i].style.display = "none";
};
var selectCatCb; // for compilation
var viewCat = function(cat, cb) {
    // change heading
    catheading.innerHTML = cat.name;

    // sort content nodes
    hideAllCategoriedBoxes();
    var openthese = document.getElementsByClassName(cat.key);
    for (var i = 0; i < openthese.length; i++)
        openthese[i].style.display = "block";

    if (selectCatCb) selectCatCb(cat.key);
    if (cb) cb();
};
var newCat = function(cat, cb) {
    catlist.appendChild(wrapped(newLink(cat.name, function() {
        viewCat(cat, cb); }), "div", "sbitem", "sbitem"+cat.key));
};
var getCats = function(cb, gotcats, getpath, getparams) {
    catcollection = catcollection || gotcats;
    if (catcollection) {
        cb(catcollection);
    } else {
        catcbs.push(cb);
        if (gettingcats)
            return;
        gettingcats = true;
        postData(getpath || "/get", getparams || {"key": "categories", "gtype": "categories"},
            "error retrieving categories", function(cats) {
                newDataSet(cats);
                catcollection = cats;
                for (var i = 0; i < catcbs.length; i++)
                    catcbs[i](cats);
            });
    }
};
var processCats = function(cats, cb, pcarg) {
    for (var i = 0; i < cats.length; i++)
        newCat(cats[i], cb);
};
var loadCategorySorter = function(cb, pcarg) {
    catlist = document.getElementById("catlist");
    catheading = document.getElementById("catheading");
    getCats(function(cats) {
        var latestcat = {"name": "Latest", "key": "Latest"};
        newCat(latestcat, cb);
        processCats(cats, cb, pcarg);
        viewCat(latestcat, cb);
    });
};
var loadCategorySelector = function(usecats, pnode, cb) {
    getCats(function(cats) {
        var onames = ["Latest"];
        var ovalues = ["Latest"];
        for (var i = 0; i < cats.length; i++) {
            if (usecats.indexOf(cats[i].key) != -1) {
                onames.push(cats[i].name);
                ovalues.push(cats[i].key);
            }
        }
        var s = newSelect(onames, ovalues);
        s.onchange = function() {
            hideAllCategoriedBoxes();
            var openthese = document.getElementsByClassName(s.value);
            for (var i = 0; i < openthese.length; i++)
                openthese[i].style.display = "block";
            cb && cb();
        }
        pnode.appendChild(s);
    });
};

// category editing stuff
var newfield;
var catEditField = function(pnode, cat) {
    var namefield = newField(null, cat && cat.name, "fullwidth");
    inputEnterCallback(namefield, function() {
        postData("/edit", {
            "key": cat && cat.key || "category", "name": namefield.value
        }, "error uploading media", function() {
            cat.name = namefield.value;
            alert("success!");
        });
    });
    pnode.insertBefore(wrapped(namefield,
        "div", "bordered padded round bottommargined"),
        newfield.parentNode.nextSibling);
};
var loadCategoryBuilder = function(pnode, uid) {
    newfield = newField("newcat", null, "fullwidth");
    inputEnterCallback(newfield, function() {
        postData("/edit", {
            "key": "category", "name": newfield.value
        }, "error uploading media", function(key) {
            var newcatdata = {
                key: key,
                name: newfield.value
            };
            newData(newcatdata);
            catEditField(pnode, newcatdata);
            catcollection.push(newcatdata);
            loadCats();
            newfield.value = '';
            newfield.onblur();
            alert("success!");
        });
    });
    pnode.appendChild(wrapped(newfield,
        "div", "bordered padded round"));
    getCats(function(cats) {
        cats.forEach(function(cat) {
            catEditField(pnode, cat);
        });
    });
};

// category tagging stuff
var cats = null;
var catsub = null;
var catuid = null; // supports some old stuff
var loadCats = function(cuid, lccb) {
    if (cuid instanceof Function)
        lccb = cuid;
    else
        catuid = cuid;
    if (!cats) {
        cats = newNode("", "div", "hidden basicpopup", "categories");
        getAllNode().appendChild(cats);
    }
    cats.innerHTML = "";
    getCats(function(data) {
        cats.appendChild(newNode("media tagger", "div", "big underline"));
        cats.appendChild(newNode("check any categories that apply, then click OK to submit!", "div", "small"));
        for (var i = 0; i < data.length; i++) {
            var cb = newField();
            cb.type = "checkbox";
            cb.name = "category";
            cb.value = data[i].key;
            cb.id = data[i].key + "checkbox";
            var cbline = newNode();
            cbline.appendChild(cb);
            cbline.appendChild(newNode(data[i].name, "label", "",
                "", {"for": cb.id, "htmlFor": cb.id}));
            cats.appendChild(cbline);
        };
        catsub = newButton("OK");
        cats.appendChild(catsub);
        cats.appendChild(newButton("Cancel", function() {
            cats.style.display = "none"; }));
        lccb && lccb(data);
    });
};
var processPData = function(pdata, pdarg) {
    return pdata;
};
var tagAndPost = function(pdata, cbfunc, pdarg) {
    cats.style.display = "block";
    centered(cats);
    catsub.onclick = function() {
        cats.style.display = "none";
        pdata.category = [];
        var allcats = document.getElementsByName("category");
        for (var i = 0; i < allcats.length; i++) {
            if (allcats[i].checked)
                pdata.category.push(allcats[i].value);
        };
        postData("/edit", processPData(pdata, pdarg), "error uploading media", cbfunc);
    }
};

// data acquisition stuff
var checkAndDo = function(keys, cb, nlcb, eb, req, getpath, getparams) {
    var needed = [];
    keys = uniquify(keys);
    for (var i = 0; i < keys.length; i++) {
        if (datamap[keys[i]] == null || req && datamap[keys[i]][req] == null)
            needed.push(keys[i]);
    }
    if (needed.length == 0)
        return cb();
    getparams = getparams || {"gtype": "data"};
    getparams.keys = needed;
    postData(getpath || "/get", getparams,
    "error retrieving featured results", function(rawdata) {
        newDataSet(rawdata);
        if (nlcb) nlcb(needed);
        cb();
    }, eb);
};

// anonymous login stuff
// any page that uses this MUST include a script with this src:
// http://www.google.com/recaptcha/api/js/recaptcha_ajax.js
var buildRecaptcha = function(key, rnode, eb, iecb) {
    try {
        Recaptcha.create(key, rnode);
        iecb && setTimeout(function() {
            inputEnterCallback(document.getElementById("recaptcha_response_field"),
                iecb);
        }, 1000);
    } catch(e) {
        eb && eb(e) || alert(e);
    }
};
var tryRecaptcha = function(respOnSuccess, respOnAttempt, respPath, respArgs) {
    var resp = Recaptcha.get_response();
    if (resp.length < 3 || resp.indexOf(" ") == -1)
        alert("don't forget to fill in the CAPTCHA! you are human, right?");
    else {
        respArgs = respArgs || {};
        respArgs.cresponse = resp;
        respArgs.cchallenge = Recaptcha.get_challenge();
        postData(respPath || "/recaptcha", respArgs, null,
            respOnSuccess, function(e) {
                if (e.trim() == "incorrect-captcha-sol")
                    e = "That's not quite right! Please try again.";
                alert(e);
                Recaptcha.reload();
            });
        respOnAttempt && respOnAttempt();
    }
};

// rich input stuff
var ricounter = 0;
var get_ta_id = function() {
    var taid = "richinput"+ricounter;
    ricounter += 1;
    return taid;
};
var richInput = function(inputnode, taid, submitbutton, content, charlimit, blurs) {
    taid = taid || get_ta_id();
    charlimit = charlimit || 500;
    var cbody = newTA(taid, content, "fullwidth");
    blurField(cbody, blurs);
    inputnode.appendChild(wrapped(cbody));
    var charcount = newNode("(" + charlimit + " chars left)", "div", "right", taid+"cc");
    cbody.onkeyup = function(e) {
        e = e || window.event;

        // counter
        var c = cbody.value.length;
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

        resizeTextArea(cbody);

        return true;
    };
    inputnode.appendChild(charcount);
    if (submitbutton)
        inputnode.appendChild(submitbutton);
};

// conversation widget
var checkFirstName, checkLastName;
var ALLOW_ANONYMOUS_COMMENTS = true;
var ANON_UID, RECAPTCHA_KEY;
var firstLastLink = function(u, noname, rfloat, hash, firstonly) {
    var nl = newNode(noname && "user"
            || (u.firstName + ((firstonly || !u.lastName) ? "" : (" " + u.lastName))),
        "b", "unamelink");
    if (rfloat)
        return wrapped(nl, "div", "small right lpadded");
    return nl;
};
var newComment = function(c, commentsnode, uid, noflagging) {
    var u = datamap[c.user];
    var commentnode = newNode("", "div", "comment");
    if (!noflagging) {
        commentnode.appendChild(wrapped(newButton("Flag", function() {
            var prob = prompt("What's the problem?");
            if (!prob) return;
            postData("/edit", {"eid": uid, "data": {"key": c.key,
                "flag": prob}}, "error flagging comment",
                function() { alert("flagged!"); });
        }), "div", "right clearnode"));
    }
    commentnode.appendChild(firstLastLink(u, null, null, null, !uid));
    commentnode.appendChild(newNode(" says: ", "b"));
    commentnode.appendChild(newNode(processComment(c.body), "span"));
    if (commentsnode.innerHTML == "no comments yet!")
        commentsnode.innerHTML = "";
    commentsnode.appendChild(commentnode);
};
var conversationInput = function(uid, ckey, convonode, contentkey, taid, noflagging, commentsnode, charlimit, blurs) {
    taid = taid || get_ta_id();
    richInput(convonode, taid,
        ckey != "conversation" && newButton("Add Comment", function() {
            var cbody = document.getElementById(taid);
            var charcount = document.getElementById(taid+"cc");
            var b = sanitize(cbody.value);
            if (b == "")
                return alert("say what?");
            postData("/say", {"uid": uid, "conversation": ckey,
                "body": b, "contentkey": contentkey},
                "error posting comment", function() {
                    newComment({"user": uid, "body": b},
                        commentsnode, uid, noflagging);
                    cbody.value = "";
                    cbody.focus();
                    charcount.innerHTML = "(" + charlimit + " chars left)"; });
        }) || null, null, charlimit, blurs);
};
var loadConversation = function(uid, ckey, convonode, contentkey, taid, noflagging, charlimit, blurs) {
    if (uid == "nouid") uid = null;
    uid = uid || ANON_UID;
    if (uid && !datamap[uid])
        newData({"key": uid, "firstName": checkFirstName(), "lastName": checkLastName()});
    if (ckey == "conversation")
        return conversationInput(uid, ckey, convonode, contentkey, taid);
    checkAndDo([ckey], function() {
        var convo = datamap[ckey];
        var uids = [];
        for (var i = 0; i < convo.comments.length; i++)
            uids.push(convo.comments[i].user);
        checkAndDo(uids, function() {
            convonode.innerHTML = "";
            var commentsnode = newNode("no comments yet!");
            convonode.appendChild(commentsnode);
            for (var i = 0; i < convo.comments.length; i++)
                newComment(convo.comments[i], commentsnode, uid, noflagging);
            if (uid)
                conversationInput(uid, ckey, convonode, contentkey,
                    taid, noflagging, commentsnode, charlimit, blurs);
            else if (ALLOW_ANONYMOUS_COMMENTS) {
                var rsubnode = newNode();
                var tryrecap = function() {
                    tryRecaptcha(function() {
                        convonode.removeChild(rnode);
                        var anonnamefield = newField();
                        blurField(anonnamefield, ["What's Your Name?",
                            "What Should We Call You?", "Who Are You?",
                            "Who Goes There?", "Please Enter A Nickname"]);
                        convonode.appendChild(anonnamefield);
                        inputEnterCallback(anonnamefield, function() {
                            var anonname = anonnamefield.value.trim();
                            if (!anonname)
                                return anonnamefield.blur();
                            postData("/reganon", {"name": anonname},
                                "error registering anonymous user name",
                                function(anonuser) {
                                    newData(anonuser);
                                    uid = anonuser.key;
                                    convonode.removeChild(anonnamefield);
                                    convonode.appendChild(newNode("Hello " + anonname));
                                    conversationInput(uid, ckey, convonode, contentkey,
                                        taid, noflagging, commentsnode, charlimit, blurs);
                                });
                        });
                    });
                };
                var rnode = wrapped([rsubnode, newButton("Submit", tryrecap)]);
                buildRecaptcha(RECAPTCHA_KEY, rsubnode, null, tryrecap);
                convonode.appendChild(rnode);
            }
            else {
                convonode.appendChild(wrapped(newLink("Join the conversation!",
                    null, "login.html"), "div", "topmargined"));
            }
        });
    }, null, null, "comments");
};

