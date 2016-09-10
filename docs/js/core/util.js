core.util = {
	chat: function() {
		var cnode = CT.dom.img("/img/cat.png", "abs r0 b0 pointer hoverglow above");
		cnode.style.height = "120px";
		cnode.style.borderLeft = "2px dashed gray";
		document.body.appendChild(cnode);
	}
};

CT.onload(core.util.chat);