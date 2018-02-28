from ..util import config, log
import yagmail, rel
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

status = {
	"queue": [],
	"churning": False
}
def _sender():
	while len(status["queue"]):
		to, subject, body, bcc = status["queue"].pop(0)
		if yag.is_closed:
			_refresh()
		log('emailing "%s" to %s'%(subject, to))
		yag.send(to, subject, body, bcc=bcc)
		if yag.unsent:
			_refresh()
	log("closing mail thread")
	status["churning"] = False

def _send(to, subject, body, bcc):
	log('enqueueing email "%s" to %s'%(subject, to))
	status["queue"].append([to, subject, body, bcc])
	if not status["churning"]:
		log('spawning mail thread')
		status["churning"] = True
		rel.thread(_sender)

def send_mail(to=None, sender=None, subject=None, body=None, html=None, bcc=None):
	if not yag:
		log('email attempted to "%s"'%(to,))
		log("## content start ##")
		log(body)
		log("## content end ##")
		return log("failed to send email -- no MAILER specified in ct.cfg!")
	to, subject, body, html = _prep(to, subject, body, html)
	_send(to, subject, html or body, bcc) # ignore sender -- same every time