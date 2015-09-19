CT.align = {
	"absers": [],
	"fullscreeners": [],
	"centerscreeners": [],
	"centerInterval": null,

	"_setLeft": function(n, x) {
	    // 8px padding
	    return n.style.left = (8 + x) + "px";
	},
	"absed": function(node, leftpx, toppx) {
	    node.style.position = "absolute";
	    CT.align._setLeft(node, leftpx);
	    if (toppx != null)
	        node.style.top = toppx + "px";
	    CT.align.absers.push([node, leftpx]);
	    return node;
	},
	"screenheight": function(node) {
	    node.style.height = (CT.align.height() - 50) + "px";
	    if (CT.align.fullscreeners.indexOf(node) == -1)
	        CT.align.fullscreeners.push(node);
	    return node;
	},
	"centernode": function(n) {
	    if (n.scrollHeight) {
	        n.origScrollHeight = n.origScrollHeight || n.scrollHeight;
	        var parentHeight = CT.align.height();
	        var paddedHeight = parentHeight - 100;
	        var nodeHeight = parseInt(n.style.height) || n.origScrollHeight;
	        if (nodeHeight > paddedHeight || nodeHeight < n.origScrollHeight) {
	            nodeHeight = Math.min(n.origScrollHeight, paddedHeight);
	            n.style.height = nodeHeight + "px";
	        }
	        n.style.top = (parentHeight - nodeHeight) / 2 + "px";
	        n.style.left = (CT.align.width() / 2) - (n.clientWidth / 2) + "px";
	    }
	},
	"centerall": function() {
	    for (var i = 0; i < CT.align.centerscreeners.length; i++)
	        CT.align.centernode(CT.align.centerscreeners[i]);
	},
	"centered": function(n) {
	    if (!CT.align.centerInterval)
	        CT.align.centerInterval = setInterval(CT.align.centerall, 1000);
	    n.style.position = "fixed";
	    CT.align.centernode(n);
	    if (CT.align.centerscreeners.indexOf(n) == -1)
	        CT.align.centerscreeners.push(n);
	    return n;
	},

	// position finders -- merge?
	"position": function(obj) {
	    var curleft = curtop = 0;
	    if (obj.offsetParent) do {
	        curleft += obj.offsetLeft;
	        curtop += obj.offsetTop;
	    } while (obj = obj.offsetParent);
	    return [curleft, curtop];
	},
	"offset": function(n) {
	    var o = {
	        "top": 0,
	        "left": 0
	    };
	    while (n) {
	        if (n == (CT.dom.ALLNODE || document.body))
	            break;
	        o["top"] += n.offsetTop;
	        o["left"] += n.offsetLeft;
	        n = n.offsetParent;
	    }
	    return o;
	},

	"height": function() {
	    return window.innerHeight || document.body.clientHeight;
	},
	"width": function() {
	    return window.innerWidth || document.body.clientWidth;
	}
};