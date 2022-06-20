import rel, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from ..util import config, log, strip_html

TMP = """From: %s
To: %s
Subject: %s

%s"""

class Mailer(object):
	def __init__(self, addr, mailername):
		self.addr = addr
		self.name = mailername
		self._yag = None
		self._smtp = None
		self.queue = []
		self.churning = False
		if not addr:
			log('no email address configured')
		elif config.gmailer or "gmail.com" in addr:
			import yagmail
			if self.name:
				mailer = {}
				mailer[addr] = self.name
			elif "gmail.com" in addr:
				mailer = addr.split("@")[0]
			else:
				mailer = addr
			try:
				self._yag = yagmail.SMTP(mailer, config.cache("email password? "))
			except:
				self._yag = yagmail.SMTP(mailer, config.cache("email password? ", overwrite=True))
		else:
			self._smtp = smtplib.SMTP('localhost')

	def _refresh(self):
		log('refreshing smtp connection')
		if self._yag:
			self._yag.login(config.cache("email password? "))
			self._yag.send_unsent()
		elif self._smtp:
			self._smtp = smtplib.SMTP('localhost')

	def _noop(self):
		if (self._yag and self._yag.is_closed) or (self._smtp and self._smtp.noop()[0] != 250):
			self._refresh()

	def _prep(self, *args):
		if str == bytes: # is python 2.7
			return [(a and type(a) == unicode and a.encode("utf-8") or a) for a in args]
		return args

	def _body(self, sender, to, subject, body):
		if config.mailhtml:
			mpmsg = MIMEMultipart('alternative')
			mpmsg['Subject'] = subject
			mpmsg['From'] = sender
			mpmsg['To'] = to
			mpmsg.attach(MIMEText(strip_html(body), 'plain'))
			mpmsg.attach(MIMEText(body.replace("\n", "<br>"), 'html'))
			return mpmsg.as_string()
		else:
			return TMP%(sender, to, subject, body)

	def _emit(self, to, subject, body, bcc):
		log('emailing "%s" to %s'%(subject, to))
		if self._yag: # bcc yagmail only!
			self._yag.send(to, subject, body, bcc=bcc)
			if self._yag.unsent:
				self._refresh()
		elif self._smtp:
			sender = self.name and "%s <%s>"%(self.name, self.addr) or self.addr
			self._smtp.sendmail(self.addr, to, self._body(sender, to, subject, body))

	def _sender(self):
		while len(self.queue):
			to, subject, body, bcc = self.queue.pop(0)
			self._noop()
			self._emit(to, subject, body, bcc)
		log("closing mail thread")
		self.churning = False

	def _send(self, to, subject, body, bcc):
		if to.endswith(".@gmail.com"): # ridiculous
			log('dropped trailing "." from ridiculous email: "%s"'%(to,))
			to = to.replace(".@gmail.com", "@gmail.com")
		log('enqueueing email "%s" to %s'%(subject, to))
		self.queue.append([to, subject, body, bcc])
		if not self.churning:
			log('spawning mail thread')
			self.churning = True
			rel.thread(self._sender)

	def mail(self, to=None, sender=None, subject=None, body=None, html=None, bcc=None):
		if not self._yag and not self._smtp:
			log('email attempted to "%s"'%(to,))
			log("## content start ##")
			log(body)
			log("## content end ##")
			return log("failed to send email -- no MAILER specified in ct.cfg!")
		to, subject, body, html = self._prep(to, subject, body, html)
		self._send(to, subject, html or body, bcc) # ignore sender -- same every time

	def admins(self, subject, body, eset="contacts"):
		acfg = config.admin
		admins = acfg.get(eset)
		if not admins and eset != "contacts":
			log("no %s configured - defaulting to contacts"%(eset,))
			eset = "contacts"
			admins = acfg.get(eset)
		admins or log("(no admins specified)")
		log("emailing admins (%s): %s"%(eset, subject), important=True)
		log(body)
		for admin in admins:
			self.mail(to=admin, subject=subject, body=body)

	def reportees(self, subject, body):
		self.admins(subject, body, "reportees")

mailer = Mailer(config.mailer, config.mailername)
send_mail = mailer.mail
email_admins = mailer.admins
email_reportees = mailer.reportees