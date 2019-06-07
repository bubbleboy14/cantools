// time stuff
// Date prototype stuff from:
// http://stackoverflow.com/questions/11887934/check-if-daylight-saving-time-is-in-effect-and-if-it-is-for-how-many-hours
Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};
Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};
CT.parse.set_ts_server_offset(CAN.config.pubsub.timezone_offset);

CT.chat = {
	//
	// chat widget
	//
	"currentRoom": null,
	"windowIsActive": null,
	"chatBoxStyle": null,
	"lastHash": null,
	"flashBackTimeout": null,
	"flashTabTimeout": null,
	"orig_background": null,
	"orig_title": document.title,
	"groups": {},
	"rooms": {},
	"roomData": {},

	// focus input
	"focusChatInput": function() {
	    var chatinput = CT.dom.id("chatin" + CT.chat.currentRoom);
	    if (chatinput)
	        chatinput.focus();
	    else
	        setTimeout(CT.chat.focusChatInput, 500);
	},

	// background flashing
	"flashBack": function(flashColor) {
	    if (!CT.chat.chatBoxStyle) {
	        CT.chat.chatBoxStyle = CT.dom.id("chatbox").style;
	        CT.chat.orig_background = CT.chat.chatBoxStyle.background;
	    }
	    if (CT.chat.windowIsActive) {
	        CT.chat.chatBoxStyle.background = CT.chat.orig_background;
	        document.location.hash = "ux";
	    }
	    else {
	        CT.chat.chatBoxStyle.background = (CT.chat.chatBoxStyle.background
	        	!= CT.chat.orig_background) ? CT.chat.orig_background : flashColor;
	        CT.chat.flashBackTimeout = setTimeout(CT.chat.flashBack, 1000, flashColor);
	    }
	},

	// title flashing
	"clearTab": function() {
	    clearTimeout(CT.chat.flashTabTimeout);
	    document.title = CT.chat.orig_title;
	},
	"flashTab": function(message) {
	    if (CT.chat.windowIsActive) {
	        document.title = CT.chat.orig_title;
	        CT.chat.lastHash = null;
	        var ifr = CT.dom.id("canchatiframe");
	        if (ifr) CT.dom.getLoc(ifr).hash = "ux";
	    }
	    else {
	        document.title = (document.title != CT.chat.orig_title)
	        	? CT.chat.orig_title : message;
	        CT.chat.flashTabTimeout = setTimeout(CT.chat.flashTab, 1000, message);
	    }
	},
	"chatWidgetOpened": function() {
	    if (CT.chat.chatBoxStyle) {
	        clearTimeout(CT.chat.flashBackTimeout);
	        CT.chat.chatBoxStyle.background = CT.chat.orig_background;
	    }
	    CT.chat.focusChatInput();
	},

	// user caching
	"guestCheck": function(key, uid) { // uid is optional
		if (CT.data.get(key))
			return;
	    if (key.indexOf("guest") != -1) {
	        CT.data.add({
	            "key": key,
	            "firstName": key.replace("[guest]", ""),
	            "lastName": "(guest)",
	            "zipcode": { city: "unknown" }
	        });
	    }
        else if (key == uid) {
            CT.data.add({
            	"key": uid,
            	"lastName": CAN.cookie.checkLastName(),
                "firstName": CAN.cookie.checkFirstName(),
                "zipcode": { city: "unknown" }
            });
        }
    },

	"userSpotlight": function(key, uspot, isWidget, noFocus) {
	    CT.data.require(key, function(u) {
	        uspot.innerHTML = "";
	        uspot.appendChild(CT.dom.node(CT.dom.img("/get?gtype=avatar&uid="
	        	+ CAN.cookie.flipReverse(u.key)),
	            "div", isWidget ? "right" : "right shiftupsome"));
	        uspot.appendChild(CT.dom.node(u.fullName, "div", "bold"));
	        uspot.appendChild(CT.dom.node("Hometown: " + u.zipcode.city));
	        if (u.lastName != "(guest)")
	            uspot.appendChild(CT.dom.link("View Feed", null, "/feed.html#!"
	                + CAN.cookie.flipReverse(u.key), null, null, null, true));
	        !noFocus && CT.chat.focusChatInput();
	    }, ["zipcode"]);
	},
	"privateChatName": function(key1, key2) {
	    return [key1, key2].sort().join('').replace(/ /g, "");
	},

	"scrollOutie": function() {
	    var outie = CT.chat.rooms[CT.chat.currentRoom].outie;
	    outie.scrollTop = outie.scrollHeight;
	    setTimeout(function() { // wait a tick...
	        outie.scrollTop = outie.scrollHeight;
	    }, 1000);
	},

	"selectRoomCb": function(room, isWidget, userKey) {
	    return function() {
	        var rd = CT.chat.roomData[room];
	        rd.pending = 0;
	        if (userKey) {
	            var sameNames = document.getElementsByClassName("presence" + userKey);
	            for (var i = 0; i < sameNames.length; i++)
	                sameNames[i].firstChild.innerHTML = rd.name;
	        } else
	            CT.dom.id(rd.key).firstChild.innerHTML = rd.name;
	        CT.chat.currentRoom = room;
	        isWidget ? CT.dom.id("peopleButton").onclick()
	            : CAN.widget.share.updateShareItem("community", room, "People");
	        CT.chat.scrollOutie();
	        CT.chat.focusChatInput();
	    };
	},

	"addUser": function(key, channel_name, uspot, isWidget, uid) {
	    if (key == uid && channel_name.indexOf(key) != -1)
	        return;

	    var u = CT.data.get(key);

	    if (!u.fullName) {
	        u.fullName = u.firstName + " " + u.lastName;
	        CT.chat.loadChatRoom(uid, u.fullName, CT.dom.id(isWidget
	            ? "presence" : "chsides"), uspot, isWidget, key);
	    }

	    var cp = CT.chat.rooms[channel_name].presence;
	    var userLinkId = "presence" + channel_name + key;
	    if (cp && !CT.dom.id(userLinkId)) {
	        var chatkey = CT.chat.privateChatName(uid, key);
	        var privateChatCallback = CT.chat.selectRoomCb(chatkey, isWidget, key);
	        cp.appendChild(CT.dom.node(CT.dom.link(u.fullName, function() {
	            CT.chat.userSpotlight(u.key, uspot, isWidget, true);
	            if (key != uid) {
	                CT.panel.swap(chatkey, true, "ch", true);
	                privateChatCallback();
	            }
	        }), "div", "presence"+key, userLinkId));
	    }
	    CT.chat.roomData[channel_name].presence[key] = true;
	},

	"say": function(key, payload, datetime, outie) {
	    payload = CT.parse.process(payload);
	    var u = CT.data.get(key);
	    var ts = CT.dom.node(" [" + CT.parse.timeStamp(datetime)
	    	+ "]", "i", "small gray");
	    outie.appendChild(CT.dom.node([CT.dom.node(u.fullName, "b"),
	        ts, CT.dom.node(": " + payload, "span")]));
	    CT.chat.scrollOutie();
	    setInterval(function() {
	        ts.innerHTML = " [" + CT.parse.timeStamp(datetime) + "]";
	    }, 60000);
	},
	"loadChatWidget": function(uid, roomname, outie, innie, presence, uspot, isWidget) {
	    CT.chat.rooms[roomname] = {"outie": outie, "innie": innie, "presence": presence};
	    if (!CT.pubsub.isInitialized()) {
	    	var onMessage = function(frame) {
                if (frame.channel != CT.chat.currentRoom && frame.user != uid) {
                    var rd = CT.chat.roomData[frame.channel];
                    rd.pending += 1;
                    var newStr = "<b>" + rd.name + " (" + rd.pending + ")</b>";;
                    if (frame.channel == CT.chat.privateChatName(uid, frame.user)) {
                        var sameNames = document.getElementsByClassName("presence" + frame.user);
                        for (var i = 0; i < sameNames.length; i++)
                            sameNames[i].firstChild.innerHTML = newStr;
                    }
                    else
                        CT.dom.id(rd.key).firstChild.innerHTML = newStr;
                }
                CT.data.require(frame.user, function(frameUser) {
                    var flasher = frameUser.firstName + " says...";
                    if (!CT.chat.windowIsActive && frame.user != uid) {
                        if (isWidget) {
                            location.hash = 'u' + flasher;
                            CT.chat.flashBack("lightgray");
                        }
                        else
                            CT.chat.flashTab(flasher);
                    }
                    CT.chat.userSpotlight(frame.user, uspot, isWidget, true);
                    CT.chat.say(frame.user, frame.message,
                    	frame.datetime, CT.chat.rooms[frame.channel].outie);
                }, ["zipcode"]);
            };
        	CT.pubsub.connect(location.hostname == "localhost" ? "localhost"
        		: CAN.config.pubsub.host, CAN.config.pubsub.port, uid);
	        CT.pubsub.set_cb("open", function() {
	            for (var r in CT.chat.rooms)
	                CT.chat.rooms[r].outie.appendChild(CT.dom.node("connected"));
	        });
	        CT.pubsub.set_cb("close", function() {
	            for (var r in CT.chat.rooms)
	                CT.chat.rooms[r].outie.appendChild(CT.dom.node("connection closed"));
	        });
	        CT.pubsub.set_cb("error", function() {
	            for (var r in CT.chat.rooms)
	                CT.chat.rooms[r].outie.appendChild(CT.dom.node("error :-\\"));
	        });
	        CT.pubsub.set_cb("subscribe", function(s) {
	            // compile and require necessary keys
	            var channel_name = s.channel;
	            var needed = s.presence;
	            for (var i = 0; i < s.history.length; i++)
                    CT.data.append(needed, s.history[i].user);
	            CT.data.requireAll(needed, function() {
	                // presence
	                for (var i = 0; i < s.presence.length; i++)
	                    CT.chat.addUser(s.presence[i],
	                    	channel_name, uspot, isWidget, uid);
	                CT.chat.userSpotlight((channel_name.indexOf(uid) != -1) ?
	                    channel_name.replace(uid, "") : s.presence[0],
	                    uspot, isWidget, true);
	                s.history.forEach(onMessage);
	            }, uid, ["zipcode"]);
	        });
			CT.pubsub.set_cb("join", function(channel, uname) {
                CT.data.require(uname, function() {
                    if (!CT.chat.roomData[channel].presence[uname])
                        CT.chat.addUser(uname, channel, uspot, isWidget, uid);
                }, ["zipcode"]);
            });
            CT.pubsub.set_cb("leave", function(channel, uname) {
            	var pnode = CT.chat.rooms[channel].presence;
                pnode && pnode.removeChild(CT.dom.id("presence" + channel + uname));
                delete CT.chat.roomData[channel].presence[uname];
            });
            CT.pubsub.set_cb("message", onMessage);
	    }
	    CT.pubsub.subscribe(roomname);

	    // in / out
	    innie.onkeydown = function(e) {
	        if (innie.value == "")
	            return;
	        e = e || window.event;
	        var code = e.keyCode || e.which;
	        if (code == 13 || code == 3) { // enter and return
	            CT.pubsub.publish(roomname, CT.parse.sanitize(innie.value));
	            innie.value = "";
	        }
	    };
	},
	"CHAT_TITLE_STYLE": 'chatname',
	"NO_INFO_MSG": " hasn't filled out the 'Other Interests or Comments' section on the profile page. How mysterious!",
	"loadChatRoom": function(uid, cname, chsides, uspot, isWidget, userKey) {
	    var cappedname = CT.parse.words2title(cname);
	    var nospace = userKey ? CT.chat.privateChatName(uid, userKey)
	    	: cappedname.replace(/ /g, "");
	    if (userKey)
	        cname = nospace;
	    CT.chat.roomData[cname] = {
	        "key": "chitem" + nospace,
	        "name": cappedname,
	        "pending": 0,
	        "presence": {}
	    };
	    var thispanel = CT.dom.node("", "div",
	        "chpanel hidden", "chpanel"+nospace);
	    thispanel.appendChild(CT.dom.node(cappedname,//+" Chat",
	        "div", "bigger bold bottompadded nowrap " + CT.chat.CHAT_TITLE_STYLE));
	    var cout = CT.dom.node("", "div", "chatout", "chatout" + cname);
	    var cin = CT.dom.field("chatin" + cname, "", "chatin");
	    thispanel.appendChild(cout);
	    thispanel.appendChild(cin);
	    chpanels.appendChild(thispanel);
	    var thisside = CT.dom.node("", "div",
	        "chpanel hidden", "chpanel" + nospace + "Side");
	    if (userKey)
	        thisside.appendChild(CT.dom.node(CT.parse.process(CT.data.map[userKey].blurb,
	        	true) || (cappedname + CT.chat.NO_INFO_MSG), "div", "small gray scrollsmall"));
	    else {
	        thisside.appendChild(CT.dom.node("Chatting Users",
	            "div", "bold blue bottompadded"));
	        var cpresence = CT.dom.node("", "div", "small");
	        thisside.appendChild(cpresence);
	    }
	    chsides.appendChild(thisside);
	    CT.chat.loadChatWidget(uid, cname, cout, cin, cpresence, uspot, isWidget);
	    return cappedname;
	},
	"loadChatGroup": function(uid, rooms, pnode, noclear, chsides, uspot, isWidget) {
	    var cappedrooms = [];
	    var cbs = [];
	    for (var i = 0; i < rooms.length; i++) {
	        var cr = CT.chat.loadChatRoom(uid, rooms[i], chsides, uspot, isWidget);
	        CT.chat.groups[rooms[i]] = cr;
	        cappedrooms.push(cr);
	        cbs.push(CT.chat.selectRoomCb(rooms[i], isWidget));
	    }
	    CT.chat.currentRoom = rooms[0];
	    CT.panel.load(cappedrooms, true, "ch", pnode,
	        null, null, null, noclear, null, cbs);
	},
	"loadAllChats": function(uid, chpanels, chsides, uspot, cb, mr, mrlink, mrcontainer) {
	    if (!uid) { // widget only
	        var namePrompt = CT.dom.node();
	        namePrompt.appendChild(CT.dom.node([
	            CT.dom.node("Enter your name:", "span"),
	            CT.dom.inputEnterCallback(CT.dom.field(), function(gname) {
	                document.location.hash = "ue";
	                chpanels.removeChild(namePrompt);
	                var guestname = gname + "[guest]";
	                CAN.cookie.set(guestname);
	                CT.chat.loadAllChats(guestname, chpanels, chsides,
	                    uspot, cb, mr, mrlink, mrcontainer);
	                CAN.cookie.set();
	            })
	        ], "div", "bold bottompadded"));
	        namePrompt.appendChild(CT.dom.link("Or sign in to join this chat room :)",
	            function() {
	                window.open(location.protocol + core.config.ctnet.domain + "/login.html",
	                    "_blank");
	            }));
	        chpanels.appendChild(namePrompt);
	        return;
	    }
	    var isGuest = uid.indexOf("guest") != -1;
	    var isWidget = false;
	    if (!mr) {
	        isWidget = true;
	        mr = CT.dom.id("chitems");
	        mr.appendChild(CT.dom.node("Main Rooms",
	            "div", "big bold bottommargined"));
	    }
	    var loadGroupRooms = function() {
	        var pdata = {"approved": "both", "gtype": "media",
	            "list_only": 1, "mtype": "group", "number": 1000, "offset": 0};
	        if (!isGuest)
	            pdata.uid = pdata.authid = uid;
	        CT.net.post("/get", pdata, "error retrieving groups",
	            function(glist) {
	                var yg = [];
	                var og = [];
	                for (var i = 0; i < glist.length; i++) {
	                    var g = glist[i];
	                    var capped = CT.chat.loadChatRoom(uid, g.title, chsides, uspot, isWidget);
	                    CT.chat.groups[g.key] = capped;
	                    if (g.memtype)
	                        yg.push(capped);
	                    else
	                        og.push(capped);
	                }
	                if (yg.length > 0) {
	                    mr.appendChild(CT.dom.node("Your Action Groups",
	                        "div", "big bold topmargined bottommargined"));
	                    CT.panel.load(yg, true, "ch", mr,
	                        null, null, null, true);
	                }
	                if (og.length > 0) {
	                    var agtitle = isGuest ? "Action Groups" : "More Action Groups";
	                    mr.appendChild(CT.dom.node(agtitle,
	                        "div", "big bold topmargined bottommargined"));
	                    CT.panel.load(og, true, "ch", mr,
	                        null, null, null, true);
	                }
	                cb && cb();
	            });
	    };

	    if (isGuest) {
	        CT.chat.loadChatGroup(uid, ["global", "peace", "law & order", "environment",
	            "industry", "government"], null, isWidget, chsides, uspot, isWidget);
	        if (isWidget)
	            loadGroupRooms();
	        else
	            cb && cb();
	    }
	    else CT.net.post("/get", {"gtype": "user", "uid": uid, "role": 1},
	        "error retrieving roles", function(u) {
	            CT.data.add(u);

	            // main rooms
	            CT.chat.loadChatGroup(uid, ["global", "peace", "law & order",
	            	"environment", "industry", "government"],
	            	null, isWidget, chsides, uspot, isWidget);

	            // more rooms
	            if (isWidget) {
	                mr.appendChild(CT.dom.node("Your Area",
	                    "div", "big bold topmargined bottommargined"));
	            } else {
	                mrlink.onclick = function() {
	                    if (mrlink.innerHTML == "show more rooms") {
	                        mrlink.innerHTML = "hide more rooms";
	                        mrcontainer.style.display = "block";
	                    }
	                    else {
	                        mrlink.innerHTML = "show more rooms";
	                        mrcontainer.style.display = "none";
	                    }
	                };
	            }

	            // area rooms
	            CT.chat.loadChatGroup(uid, [u.zipcode.state, u.zipcode.city,
	            	u.zipcode.code], mr, isWidget, chsides, uspot, isWidget);

	            // contribution rooms
	            if (u.role.length > 0) {
	                mr.appendChild(CT.dom.node("Your Contributions",
	                    "div", "big bold topmargined bottommargined"));
	                var crooms = CT.data.copyList(u.role);
	                var founders = ["greg", "paul", "mario"];
	                if (founders.indexOf(crooms[0]) != -1)
	                    crooms[0] = "founder";
	                CT.chat.loadChatGroup(uid, crooms, mr,
	                	true, chsides, uspot, isWidget);
	            }

	            loadGroupRooms();
	        });
	}
};

CT.data.requirePrep = CT.chat.guestCheck;

// is window active?
window.onfocus = function() {
    CT.chat.windowIsActive = true;
};
window.onblur = function() {
    CT.chat.windowIsActive = false;
};