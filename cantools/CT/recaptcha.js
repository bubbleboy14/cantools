/*
This module provides functions, build() and submit(),
for messing around with recaptcha botwalls.

TODO: this functionality requires backend
integration - include complementary python module!
*/
CT.recaptcha = {
	build: function(key, rnode, eb, iecb, response_field_id) {
	    try {
	    	var cbname = "_" + Math.round(Math.random() * 100000);
			window[cbname] = function() {
		        grecaptcha.render(rnode, { sitekey: key });
		        if (iecb) {
		        	var n = document.getElementById(response_field_id
		        		|| "recaptcha_response_field");
		            n && CT.dom.inputEnterCallback(n, iecb);
		        }
			},
			CT.scriptImport("https://www.google.com/recaptcha/api.js?onload=" + cbname + "&render=explicit");
	    } catch(e) {
	        eb && eb(e) || alert(e);
	    }
	},
	submit: function(respOnSuccess, respOnAttempt, respPath, respArgs) {
	    var resp = grecaptcha.getResponse();
	    if (resp.length < 3)
	        alert("don't forget to fill in the CAPTCHA! you are human, right?");
	    else {
	        respArgs = respArgs || {};
	        respArgs.cresponse = resp;
	        CT.net.post(respPath || "/recaptcha", respArgs, null,
	            respOnSuccess, function(e) {
	                if (e.indexOf("false") != -1) {
	                	CT.log(e);
	                    e = "That's not quite right! Please try again.";
	                }
	                alert(e);
	                grecaptcha.reset();
	            });
	        respOnAttempt && respOnAttempt();
	    }
	}
};