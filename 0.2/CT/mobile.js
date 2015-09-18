CT.mobile = {
    "moptions": { // true/false for ALLNODE._mobile
        "true": ["mobile", "stretched"],
        "false": ["normal", "stretched"]
    },
    "fitNode": function(n, t, o, cb) {
        var tline, w = windowWidth() - 10,
            toff = n && CT.dom.trueOffset(n);
        CT.dom.ALLNODE.mobileNode = n;
        if (CT.dom.ALLNODE._mode == "mobile")
            tline = "scale(" + (w / n.clientWidth) + ") translate(-"
                + toff.left + "px,-" + toff.top + "px)";
        else // stretched
            tline = "scale(" + (w / CT.dom.ALLNODE.clientWidth) + ")";
        CT.dom.setVenderPrefixed(CT.dom.ALLNODE, "transform-origin",
            o ? o : (w < CT.dom.ALLNODE.clientWidth ? "0% 0%" : "50% 0%"));
        CT.dom.trans(CT.dom.ALLNODE, function() {
            n && n.scrollIntoView(true, { "behavior": "smooth" }); // for initial load
            cb && cb();
        }, "transform", 1000, null, t ? t : tline, true);
    },
    "fitAndSnap": function(n, cb) {
        if (CT.dom.ALLNODE.mobileNode) // smoothest way once we're loaded
            CT.dom.ALLNODE.mobileNode.scrollIntoView(true, { "behavior": "smooth" });
        CT.mobile.fitNode(n, null, null, cb);
    },
    "mobileSnap": function(cb) {
        if (CT.dom.ALLNODE && CT.dom.ALLNODE._mode == "mobile")
            CT.mobile.fitAndSnap(CT.dom.ALLNODE._mobileDefault, cb);
    },
    "getMobileNode": function(bdata) {
        if (bdata.id)
            return document.getElementById(bdata.id);
        else {
            var cname = (_pswap && _pswap[bdata.name])
                ? _pswap[bdata.name] : bdata.firstClass;
            return document.getElementsByClassName(cname)[0];
        }
    },
    "mobileMenuLink": function(bdata) {
        return CT.dom.labeledImage("/img/icons/" + bdata.icon + ".png",
            bdata.page && (bdata.page + ".html"), bdata.name || bdata.page,
            bdata.name || bdata.page, "centeredimg", "round bordered padded",
            "centered nowrap small", false, (bdata.id || bdata.firstClass)
                && function() {
                    CT.dom.ALLNODE.toggleMobileMenu();
                    CT.mobile.fitAndSnap(CT.mobile.getMobileNode(bdata));
                });
    },
    "initMobileMenus": function(mmbtn, loggedin) {
        mmbtn.tops = CT.dom.node(null, null,
            "button_row top_out", "top_buttons");
        mmbtn.bottoms = CT.dom.node(null, null,
            "button_row bottom_out", "bottom_buttons");

        var mobile_search = CT.dom.field("mobile_search");
        mmbtn.tops.appendChild(CT.dom.wrapped(CT.dom.wrapped(
            [CT.dom.node("CAN Smart Search"), mobile_search], "div",
            "round bordered padded", "mobile_search_node"), "label", null,
            null, {"for": "mobile_search", "htmlFor": "mobile_search"}));
        (_pswap && _pswap.top || mobileMenus.top).forEach(function(bdata) {
            mmbtn.tops.appendChild(mobileMenuLink(bdata));
        });
        mobileMenus.bottom.forEach(function(bdata) {
            mmbtn.bottoms.appendChild(CT.mobile.mobileMenuLink(bdata));
        });
        mmbtn.bottoms.appendChild(CT.mobile.mobileMenuLink(
            mobileMenus.alternatives[loggedin ? "participate" : "login"]));
        inputEnterCallback(mobile_search, doBasicSearch);
        blurField(mobile_search);

        document.body.appendChild(mmbtn.tops);
        document.body.appendChild(mmbtn.bottoms);
    },
    "_mset": function() {
        var _a = CT.dom.ALLNODE;
        return moptions[(!!(_a._mobile && _a._mobileDefault)).toString()];
    },
    "initResizer": function(loggedin) {
        // for compiler
        var curd, btn, mmbtn, _a = CT.dom.ALLNODE, zMode = function() {
            return CT.mobile._mset()[_a._mindex];
        };
        _a._mobileDefault = _a.mobileNode = CT.mobile.getMobileNode((_pswap
            && _pswap.top || mobileMenus.top)[1]);
        _a._mode = zMode();
        _a._mindex = 0;
        _a._otherMode = function() {
            return CT.mobile._mset()[(_a._mindex + 1) % 2];
        };
        _a.setScroll = function() {
            var _doscroll = function(e) {
                var n = _a.mobileNode || _a;
                if (n.getBoundingClientRect().bottom < windowHeight())
                    n.scrollIntoView(false, { "behavior": "smooth" });
            };
            window.onscroll = function(e) {
                setTimeout(_doscroll, 500);
                setTimeout(_doscroll, 1000);
                setTimeout(_doscroll, 2000);
                setTimeout(_doscroll, 3000);
            };
            var firstMove;
            window.addEventListener('touchstart', function (e) {
                firstMove = true;
            });
            window.addEventListener('touchmove', function (e) {
                if (firstMove) {
                    e.preventDefault();
                    firstMove = false;
                } else
                    window.onscroll && window.onscroll();
            });
        };
        _a._swapMode = function() {
            _a._mindex = _a._mindex ? 0 : 1;
            setTimeout(function() {
                var vp = document.getElementsByTagName("meta");
                for (var i = 0; i < vp.length; i++) {
                    if (vp[i].name == "viewport") {
                        vp[i].content = "width=device-width, initial-scale=1.0"
                            + ((_a._mode == "mobile")
                            ? ", min-scale=1.0, max-scale=1.0, user-scalable=no" : "");
                        break;
                    }
                }
            }, 200);
            _a.resize();
            _a.setScroll();
        };
        _a.toggleMobileMenu = function() {
            if (mmbtn._on) {
                mmbtn.tops.className = "button_row top_out";
                mmbtn.bottoms.className = "button_row bottom_out";
            } else {
                mmbtn.tops.className = "button_row";
                mmbtn.bottoms.className = "button_row";
            }
            mmbtn._on = !mmbtn._on;
        };
        curd = resdata[_a._otherMode()];
        btn = newImg(curd.img, null, _a._swapMode, null,
            null, curd.alt, "resize_btn", "round bordered padded");
        mmbtn = newImg("/img/mobile-menu.png", null, _a.toggleMobileMenu,
            null, null, "Mobile Menu", "mobile_menu_btn", "round bordered padded");
        _a.resize = function() {
            _a._mobile = ismobile || windowWidth() <= 720;
            _a._mode = zMode();
            if (_a._mode == "normal")
                CT.mobile.fitNode(null, "scale(1)", "50% 0%");
            else if (_a._mode == "stretched")
                CT.mobile.fitAndSnap(_a);
            else
                CT.mobile.fitAndSnap(_a._mobileDefault);
            if (_a._mode == "mobile") {
                mmbtn.style.display = "block";
                _a.chatBlock && _a.chatBlock();
            } else {
                mmbtn.style.display = "none";
                if (mmbtn._on)
                    mmbtn.onclick();
            }
            var toggleMode = _a._otherMode();
            btn.title = btn.alt = resdata[toggleMode].alt;
            btn.firstChild.firstChild.src = resdata[toggleMode].img;
        };
        document.body.appendChild(btn);
        document.body.appendChild(mmbtn);
        CT.mobile.initMobileMenus(mmbtn, loggedin);
        _a.resize();
        _a.setScroll();
    }
};