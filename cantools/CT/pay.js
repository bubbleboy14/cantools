/*
This module contains a class, CT.pay.Form, that, in conjunction
with a tightly-coupled backend component (_pay.py), provide
integration with the Braintree payment platform, which supports:

	- PayPal
	- Credit Cards
	- Venmo
	- Apple Pay
	- Android Pay
	- Bitcoin?
*/

CT.pay.Form = CT.Class({
	CLASSNAME: "CT.pay.Form",
	embed: function(token) {
		var container = CT.dom.node(null, null, null, "ctpay" + this.id);
		this.opts.parent.appendChild(CT.dom.form([
			container,
			CT.dom.field(null, this.opts.buttonText, null, "submit")
		], "/checkout"));
		braintree.setup(token, "dropin", {
			container: container.id
		});
	},
	init: function(opts) {
		this.id = CT.pay.Form._id;
		CT.pay.Form._id += 1;
		this.opts = opts = CT.merge(opts, {
			parent: document.body,
			buttonText: "Purchase"
		});
		this.embed(CT.pay._token);
	}
});
CT.pay.Form._id = 0;

CT.scriptImport("https://js.braintreegateway.com/js/braintree-2.24.1.min.js",
	function() { CT.pay._token = CT.net.get("/_pay", null, null, true); });