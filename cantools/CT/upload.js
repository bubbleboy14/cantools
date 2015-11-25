CT.upload = {
	"form": function(uid, kval, sbutton, isize) {
	    var f = CT.dom.node("", "form");
	    f.action = "/upload";
	    f.enctype = "multipart/form-data";
	    f.method = "post";
	    var u = CT.dom.field();
	    u.type = "hidden";
	    u.name = "uid";
	    u.value = uid;
	    var k = CT.dom.field();
	    k.type = "hidden";
	    k.name = "key";
	    if (kval) k.value = kval;
	    var i = CT.dom.field();
	    i.type = "file";
	    i.name = "data";
	    f.appendChild(u);
	    f.appendChild(k);
	    f.appendChild(i);
	    if (sbutton) {
	        i.size = "10";
	        f.appendChild(sbutton);
	    }
	    if (isize)
	        i.size = isize;
	    return f;
	},
	"submit": function(f, success, failure, iskey) {
		CT.require("CT.lib.aim", true);
	    AIM.submit(f, {'onComplete': function(data) {
	        var didSucceed = data.charAt(0);
	        //var val = eval("("+data.slice(1)+")");
	        if (didSucceed == '0')
	            (failure || alert)(data.slice(1));
	        else if (iskey)
	            success(data.slice(2, -2));
	        else
	            success(data.slice(1));
	    }});
	    f.submit();
	}
};