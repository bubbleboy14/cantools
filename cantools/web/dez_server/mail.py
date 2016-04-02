from ..util import config, fail
import yagmail
yag = config.mailer and yagmail.SMTP(config.mailer) # will ask for password

def send_mail(to=None, sender=None, subject=None, body=None, html=None):
	if not yag:
		fail("failed to send email -- no MAILER specified in ct.cfg!")
	contents = body and html and [body, html] or body or html
	yag.send(to=to, subject=subject, contents=contents) # ignore sender -- same every time