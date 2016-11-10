/*
This module provides two functions, wysiwygize() and qwiz(), which
both convert textareas (identified by id) into rich text editors.

### CT.rte.wysiwygize(nodeid, isrestricted, val, cb, mismatchcb)
	- nodeid: id of target textarea (must exist in DOM)
	- isrestricted: if true, disables tables and images
	- val: string value with which to initialize target text area
	- cb: callback to invoke once textarea is initialized
	- mismatchcb: callback to invoke if the reformatted text doesn't match val
### CT.rte.qwiz(nodeid, val)
	- nodeid: id of target textarea (must exist in DOM)
	- val: string value with which to initialize target text area

CT.rte.qwiz() just builds a simplified (isrestricted=true) rich text area
after first waiting for the nodeid-indicated node to appear in the DOM.

CT.rte requires the open-source TinyMCE library, pulled in via CT.scriptImport().
*/

//CT.scriptImport("CT.lib.tiny_mce.tiny_mce");
CT.scriptImport("https://cdnjs.cloudflare.com/ajax/libs/tinymce/3.5.8/tiny_mce.js");
CT.rte = {
	// wysiwyg editor widget
	"wysiwygize": function(nodeid, isrestricted, val, cb, mismatchcb) {
		if (!("tinyMCE" in window)) // just in case...
			return CT.scriptImport("CT.lib.tiny_mce.tiny_mce", function() {
				CT.rte.wysiwygize(nodeid, isrestricted, val, cb, mismatchcb);
			}, true);
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
	    var n = CT.dom.id(nodeid);
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
	    var n = CT.dom.id(nodeid);
	    if (!n) // wait for node to appear in DOM
	        return setTimeout(CT.rte.qwiz, 500, nodeid, val);
	    !n.get && CT.rte.wysiwygize(nodeid, true, val);
	}
};
