from cantools.web import respond, succeed, fail, cgi_get
from cantools import config, util
from model import *

try:
	import braintree
except:
	util.error("please install braintree >= 0.4.5")
try:
	gateway = braintree.BraintreeGateway(braintree.Configuration(
		environment=getattr(braintree.Environment, config.pay.environment),
		merchant_id=config.pay.merchant,
		public_key=config.pay.public,
		private_key=config.pay.private
	))
except:
	util.error("please install braintree >= 0.4.5 and check your PAY config values")

def response():
	nonce = cgi_get("nonce", required=False)
	if nonce:
		amount = cgi_get("amount")
		user = db.get(cgi_get("user"))
		onsale = getattr(user, "onsale", None)
		emsg = None
		result = gateway.transaction.sale({
			"amount": amount,
			"payment_method_nonce": nonce,
			"options": {
				"submit_for_settlement": True
			}
		})
		util.log(result)
		if not result.is_success:
			msg = result.errors.deep_errors
			if not msg:
				msg = "%s: %s"%(result.transaction.processor_settlement_response_code,
					result.transaction.processor_settlement_response_text)
			emsg = "%s (%s)"%(result.message, msg)
			onsale and onsale(amount, emsg)
			fail(emsg)
		onsale and succeed(onsale(amount))
	else:
		succeed(gateway.client_token.generate())

respond(response)