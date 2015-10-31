// TODO: this functionality requires backend integration
// include complementary python module!

CT.scriptImport("CT.lib.tiny_mce.tiny_mce");
CT.recaptcha = {
	"build": function(key, rnode, eb, iecb, response_field_id) {
		CT.require("CT.lib.recaptcha_ajax", true);
	    try {
	        Recaptcha.create(key, rnode);
	        iecb && setTimeout(function() {
	        	var n = document.getElementById(response_field_id
            		|| "recaptcha_response_field");
	            n && CT.dom.inputEnterCallback(n, iecb);
	        }, 1000);
	    } catch(e) {
	        eb && eb(e) || alert(e);
	    }
	},
	"submit": function(respOnSuccess, respOnAttempt, respPath, respArgs) {
	    var resp = Recaptcha.get_response();
	    if (resp.length < 3)
	        alert("don't forget to fill in the CAPTCHA! you are human, right?");
	    else {
	        respArgs = respArgs || {};
	        respArgs.cresponse = resp;
	        respArgs.cchallenge = Recaptcha.get_challenge();
	        CT.net.post(respPath || "/recaptcha", respArgs, null,
	            respOnSuccess, function(e) {
	                if (e.trim() == "incorrect-captcha-sol")
	                    e = "That's not quite right! Please try again.";
	                alert(e);
	                Recaptcha.reload();
	            });
	        respOnAttempt && respOnAttempt();
	    }
	}
};