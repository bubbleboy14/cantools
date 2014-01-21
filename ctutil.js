/*****
 * ctutil.js
 * version 0.1.11
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
