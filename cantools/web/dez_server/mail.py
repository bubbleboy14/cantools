from ..util import config, log
import yagmail
yag = None
if config.mailer:
	mailer = config.mailer
	if config.mailername:
		mailer = {}
		mailer[config.mailer] = config.mailername
	yag = yagmail.SMTP(mailer, config.cache("email password? "))

def _refresh():
	log('refreshing smtp connection')
	yag.login(config.cache("email password? "))
	yag.send_unsent()

def _prep(*args):
	return [(a and type(a) == unicode and a.encode("utf-8") or a) for a in args]

def send_mail(to=None, sender=None, subject=None, body=None, html=None, bcc=None):
	if not yag:
		return log("failed to send email -- no MAILER specified in ct.cfg!")
	to, subject, body, html = _prep(to, subject, body, html)
	if yag.is_closed:
		_refresh()
	log('emailing "%s" to %s'%(subject, to)) # ignore sender -- same every time
	yag.send(to, subject, html or body, bcc=bcc)
	if yag.unsent:
		_refresh()