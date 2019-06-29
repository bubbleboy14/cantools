/*
This module contains a class, CT.pay.Form, and an initialization
function, CT.pay.init(). The module can function in two ways.

### braintree
In conjunction with a tightly-coupled backend component (_pay.py),
this module provides integration with the Braintree payment platform,
which supports:

	- PayPal
	- Credit Cards
	- Venmo
	- Apple Pay
	- Android Pay
	- Bitcoin?

Use it like this:

	CT.pay.init({
		mode: "braintree",
		cb: function() {
			new CT.pay.Form({
				parent: pnode
			});
		}
	});

### carecoin
To use the CC api, do something like this:

	CT.pay.init({
		mode: "cc",
		cb: function() {
			new CT.pay.Form({
				parent: pnode,
				item: {
					amount: 1.2,
					notes: "these are some notes",
					membership: "VENDOR_MEMBERSHIP_KEY"
				}
			});
		}
	});
*/

CT.pay = {
	_: {
		gateways: {
			braintree: "https://js.braintreegateway.com/js/braintree-2.24.1.min.js",
			cc: "https://cc.mkult.co/comp/api.js"
		},
		setToken: function() {
			var opts = CT.pay.opts;
			if (opts.mode == "braintree")
				CT.pay._.token = CT.net.get("/_pay", null, null, true);
			opts.cb && opts.cb();
		}
	},
	paid: function() {
		alert("great! now just click the confirmation link in your inbox!");
	},
	init: function(opts) {
		var _ = CT.pay._;
		CT.pay.opts = opts;
		CT.scriptImport(_.gateways[opts.mode], _.setToken);
	}
};

CT.pay.Form = CT.Class({
	CLASSNAME: "CT.pay.Form",
	braintree: function(token) {
		var container = CT.dom.node(null, null, null, "ctpay" + this.id);
		this.opts.parent.appendChild(CT.dom.form([
			container,
			CT.dom.field(null, this.opts.buttonText, null, "submit")
		], "/checkout"));
		braintree.setup(token, "dropin", {
			container: container.id
		});
	},
	cc: function() {
		var oz = this.opts, n = CT.dom.div();
		CT.dom.addContent(oz.parent, n);
		CC.payer(n, CT.pay.paid, oz.item);
	},
	init: function(opts) {
		this.id = CT.pay.Form._id;
		CT.pay.Form._id += 1;
		this.opts = opts = CT.merge(opts, {
			parent: document.body,
			buttonText: "Purchase"
		});
		this[CT.pay.opts.mode](CT.pay._.token);
	}
});
CT.pay.Form._id = 0;