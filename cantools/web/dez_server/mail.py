from ..util import config, log
import yagmail
yag = None
if config.mailer:
	mailer = config.mailer
	if config.mailername:
		mailer = {}
		mailer[config.mailer] = config.mailername
	yag = yagmail.SMTP(mailer, config.cache("email password? "))

def send_mail(to=None, sender=None, subject=None, body=None, html=None):
	if not yag:
		return log("failed to send email -- no MAILER specified in ct.cfg!")
	if type(to) == unicode:
		to = str(to)
	yag.send(to, subject, str(html or body)) # ignore sender -- same every time