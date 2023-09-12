/*
This module takes a website formatted for a regular computer screen
and, via configuration, mobilizes it by zooming in on specific sections
of the page and providing user interface elements for scaling/translating
between components.
*/

CT.mobile = {
    "options": { // true/false for ALLNODE._mobile
        "mobile": ["mobile", "stretched"],
        "normal": ["normal", "stretched"],
        "tablet": ["stretched", "mobile"]
    },
    _dur: 0,
    "fitNode": function(n, t, o, cb) {
        var tline, w = CT.align.width() - 10,
            toff = n && CT.align.offset(n), ready;
        CT.dom.ALLNODE.mobileNode = n;
        if (CT.dom.ALLNODE._mode == "mobile")
            tline = "scale(" + (w / n.clientWidth) + ") translate(-"
                + toff.left + "px,-" + toff.top + "px)";
        else // stretched
            tline = "scale(" + (w / CT.dom.ALLNODE.clientWidth) + ")";
        CT.trans.setVenderPrefixed(CT.dom.ALLNODE, "transform-origin",
            o ? o : (w < CT.dom.ALLNODE.clientWidth ? "0% 0%" : "50% 0%"));
        CT.trans.trans({
            node: CT.dom.ALLNODE,
            property: "transform",
            value: t && t || tline,
            duration: CT.mobile._dur,
            prefix: true,
            cb: function() {
                ready && n && n.scrollIntoView({ block: "start", behavior: "smooth" });
                document.body.scrollTop = 0;
                ready = true;
                cb && cb();
            }
        });
        if (!CT.mobile._dur) {
            CT.mobile._dur = 1000;
            n && n.scrollIntoView({ block: "start", behavior: "auto" }); // for initial load
            setTimeout(function() { // meh........ it works.
                CT.dom.ALLNODE.resize();
                document.body.scrollTop = 0;
            }, 1000);
        }
    },
    "fitAndSnap": function(n, cb) {
//        if (CT.dom.ALLNODE.mobileNode) // smoothest way once we're loaded
  //          CT.dom.ALLNODE.mobileNode.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
            var cname = (CT.mobile.page && CT.mobile.page[bdata.name])
                ? CT.mobile.page[bdata.name] : bdata.firstClass;
            return document.getElementsByClassName(cname)[0];
        }
    },
    "mobileMenuLink": function(bdata) {
        var pref = "/img/" + (bdata.section ? (bdata.page || bdata.section) : "icons") + "/",
            name = bdata.name || (bdata.section && bdata.icon) || bdata.page || bdata.icon,
            url = !(bdata.click || bdata.clickChild) && bdata.page && (bdata.page + ".html"),
            cname = "round bordered padded";
        if (url && bdata.section)
            url += "#!" + bdata.section;
        if (bdata.className)
            cname += " " + bdata.className;
        return CT.dom.labeledImage(pref + bdata.icon + ".png", url,
            name, name, "centeredimg", cname, "centered nowrap small", false,
            (bdata.id || bdata.firstClass || bdata.click || bdata.clickChild) && function() {
                CT.dom.ALLNODE.toggleMobileMenu();
                if (bdata.click)
                    CT.dom.id(bdata.click).onclick();
                else if (bdata.clickChild)
                    CT.dom.id(bdata.clickChild).firstElementChild.onclick();
                else
                    CT.mobile.fitAndSnap(CT.mobile.getMobileNode(bdata));
            }, true, "mm" + name);
    },
    "initMobileMenus": function(mmbtn, loggedin, searchcb) {
        mmbtn.tops = CT.dom.node(null, null,
            "button_row top_out", "top_buttons");
        mmbtn.bottoms = CT.dom.node(null, null,
            "button_row bottom_out", "bottom_buttons");

        var mobile_search = CT.dom.field("mobile_search");
        mmbtn.tops.appendChild(CT.dom.node(CT.dom.node(
            [CT.dom.node("CAN Smart Search"), mobile_search], "div",
            "round bordered padded", "mobile_search_node"), "label", null,
            null, {"for": "mobile_search", "htmlFor": "mobile_search"}));
        (CT.mobile.page && CT.mobile.page.top || CT.mobile.menus.top).forEach(function(bdata) {
            mmbtn.tops.appendChild(CT.mobile.mobileMenuLink(bdata));
        });
        CT.mobile.menus.bottom.forEach(function(bdata) {
            mmbtn.bottoms.appendChild(CT.mobile.mobileMenuLink(bdata));
        });
        mmbtn.bottoms.appendChild(CT.mobile.mobileMenuLink(
            CT.mobile.menus.alternatives[loggedin ? "participate" : "login"]));
        CT.dom.inputEnterCallback(mobile_search, searchcb);
        CT.dom.blurField(mobile_search);

        document.body.appendChild(mmbtn.tops);
        document.body.appendChild(mmbtn.bottoms);

        var lefts = CT.mobile.page && CT.mobile.page.left || CT.mobile.menus.left;
        if (lefts) {
            mmbtn.lefts = CT.dom.node(null, null,
                "button_row_side left_out", "left_buttons");
            lefts.forEach(function(bdata) {
                mmbtn.lefts.appendChild(CT.mobile.mobileMenuLink(bdata));
            });
            document.body.appendChild(mmbtn.lefts);
        }

        var rights = CT.mobile.page && CT.mobile.page.right || CT.mobile.menus.right;
        if (rights) {
            mmbtn.rights = CT.dom.node(null, null,
                "button_row_side right_out", "right_buttons");
            rights.forEach(function(bdata) {
                mmbtn.rights.appendChild(CT.mobile.mobileMenuLink(bdata));
            });
            document.body.appendChild(mmbtn.rights);
        }
    },
    "_mset": function() {
        var _a = CT.dom.ALLNODE, i, m,
            modes = ["mobile", "tablet"];
        for (i = 0; i < modes.length; i++) {
            m = modes[i];
            if (_a["_" + m])
                return CT.mobile.options[m];
        }
        return CT.mobile.options.normal;
    },
    "isMobile": function() {
        return CT.dom.ALLNODE._mobile;
    },
    "initResizer": function(loggedin, resdata, menus, page, searchcb) {
        CT.mobile.menus = menus;
        CT.mobile.page = page;

        // for compiler
        var curd, btn, mmbtn, _a = CT.dom.ALLNODE, zMode = function() {
            return CT.mobile._mset()[_a._mindex];
        };
        var setScroll = function() {
            var _doscroll = function(e) {
                var n = _a.mobileNode || _a;
                if (n.getBoundingClientRect().bottom < CT.align.height())
                    n.scrollIntoView({ block: "nearest", behavior: "smooth" });
            };
            window.onscroll = function(e) {
                setTimeout(_doscroll, 500);
//                setTimeout(_doscroll, 1000);
  //              setTimeout(_doscroll, 2000);
    //            setTimeout(_doscroll, 3000);
            };
//            var firstMove;
//            window.addEventListener('touchstart', function (e) {
  //              firstMove = true;
    //        });
            window.addEventListener('touchmove', function (e) {
      //          if (firstMove) {
        //            e.preventDefault();
          //          firstMove = false;
            //    } else
                    window.onscroll && window.onscroll();
            });
        };
        _a._mobileDefault = _a.mobileNode =
            CT.mobile.getMobileNode((page && page.top || menus.top)[1]);
        _a._mode = zMode();
        _a._mindex = 0;
        _a._otherMode = function() {
            return CT.mobile._mset()[(_a._mindex + 1) % 2];
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
        };
        _a.toggleMobileMenu = function() {
            if (mmbtn._on) {
                mmbtn.tops.className = "button_row top_out";
                mmbtn.bottoms.className = "button_row bottom_out";
                if (mmbtn.lefts)
                    mmbtn.lefts.className = "button_row_side left_out";
                if (mmbtn.rights)
                    mmbtn.rights.className = "button_row_side right_out";
            } else {
                mmbtn.tops.className = "button_row";
                mmbtn.bottoms.className = "button_row";
                if (mmbtn.lefts)
                    mmbtn.lefts.className = "button_row_side";
                if (mmbtn.rights)
                    mmbtn.rights.className = "button_row_side";
            }
            mmbtn._on = !mmbtn._on;
        };
        curd = resdata[_a._otherMode()];
        btn = CT.dom.img(curd.img, null, _a._swapMode, null,
            null, curd.alt, "resize_btn", "round bordered padded");
        mmbtn = CT.dom.img("/img/mobile-menu.png", null, _a.toggleMobileMenu,
            null, null, "Mobile Menu", "mobile_menu_btn", "round bordered padded");
        _a.resize = function() {
            _a._mobile = CT.info.mobile || CT.align.width() <= 720;
            _a._tablet = CT.info.tablet || CT.align.width() <= 980;
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
        CT.mobile.initMobileMenus(mmbtn, loggedin, searchcb);
        _a.resize();
        setScroll();
    }
};