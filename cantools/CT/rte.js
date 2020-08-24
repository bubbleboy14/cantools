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
CT.scriptImport("https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.7.13/tinymce.min.js");
CT.rte = {
	// wysiwyg editor widget
	"wysiwygize": function(nodeid, isrestricted, val, cb, mismatchcb) {
		if (!("tinyMCE" in window)) // just in case...
			return CT.scriptImport("https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.7.13/tinymce.min.js", function() {
				CT.rte.wysiwygize(nodeid, isrestricted, val, cb, mismatchcb);
			}, true);
		var d = {
			selector: "#" + nodeid,
			menubar: false,
			plugins: [
				'advlist autolink lists link image charmap print preview anchor textcolor',
				'searchreplace visualblocks code fullscreen',
				'insertdatetime media table contextmenu paste code help wordcount'
			  ],
			toolbar: 'insert | undo redo | formatselect | alignleft aligncenter alignright alignjustify | bold italic forecolor backcolor | bullist numlist outdent indent removeformat help',
		};
		if (isrestricted)
			d.toolbar = d.toolbar.slice(9);
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
			return stripnbsp ? c.replace(/&nbsp;/g, " ") : c;
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
	"qwiz": function(nodeid, val, unrestricted) {
		var n = CT.dom.id(nodeid);
		if (!n) // wait for node to appear in DOM
			return setTimeout(CT.rte.qwiz, 500, nodeid, val, unrestricted);
		!n.get && CT.rte.wysiwygize(nodeid, !unrestricted, val);
	}
};
