import rel, smtplib, imaplib
from email import message_from_bytes
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
		self.cbs = {}
		self.churning = False
		if not addr:
			pass#log('no email address configured')
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
			try: # failures probs handled by _refresh()...
				self._yag.send(to, subject, body, bcc=bcc)
			except (smtplib.SMTPServerDisconnected, smtplib.SMTPDataError) as e:
				log("smtp error (will try again): %s"%(str(e),))
			if self._yag.unsent:
				self._refresh()
		elif self._smtp:
			sender = self.name and "%s <%s>"%(self.name, self.addr) or self.addr
			try:
				self._smtp.sendmail(self.addr, to, self._body(sender, to, subject, body))
			except smtplib.SMTPRecipientsRefused:
				log("Recipient Refused: %s"%(to,), important=True)
				if "refused" in self.cbs:
					self.cbs["refused"](to)

	def _sender(self):
		while len(self.queue):
			to, subject, body, bcc = self.queue.pop(0)
			self._noop()
			self._emit(to, subject, body, bcc)
		log("closing mail thread")
		self.churning = False

	def _send(self, to, subject, body, bcc):
		if to.endswith("@gmail.com"):
			while to.endswith(".@gmail.com"): # ridiculous
				log('dropped trailing "." from ridiculous email: "%s"'%(to,))
				to = to.replace(".@gmail.com", "@gmail.com")
			while ".." in to:
				to = to.replace("..", ".")
		log('enqueueing email "%s" to %s'%(subject, to))
		self.queue.append([to, subject, body, bcc])
		if not self.churning:
			log('spawning mail thread')
			self.churning = True
			rel.thread(self._sender)

	def on(self, event_name, cb):
		self.cbs[event_name] = cb

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
		if len(body) > 100:
			log(body[:100] + " ...")
		else:
			log(body)
		for admin in admins:
			self.mail(to=admin, subject=subject, body=body)

	def reportees(self, subject, body):
		self.admins(subject, body, "reportees")

mailer = Mailer(config.mailer, config.mailername)
send_mail = mailer.mail
email_admins = mailer.admins
email_reportees = mailer.reportees

class Reader(object):
	def __init__(self, addr):
		self.addr = addr
		if addr:
			self.isgmail = config.gmailer or addr.endswith("@gmail.com")
			self.domain = self.isgmail and "imap.gmail.com" or addr.split("@").pop()

	def connect(self, mailbox="inbox"):
		self.conn = imaplib.IMAP4_SSL(self.domain)
		self.conn.login(self.addr, config.cache("email password? "))
		self.conn.select(mailbox)

	def disconnect(self):
		self.conn.close()
		self.conn.logout()
		self.conn = None

	def ids(self, criteria="UNSEEN", critarg=None):
		typ, msgids = self.conn.search(None, criteria, critarg)
		return msgids[0].split()[::-1]

	def fetch(self, num, mparts="(RFC822)"):
		typ, data = self.conn.fetch(num, mparts)
		return message_from_bytes(data[0][1])

	def read(self, msg):
		bod = msg
		if msg.is_multipart():
			for part in msg.walk():
				if part.get_content_type() == "text/plain":
					bod = part
		return bod.get_payload(decode=True).decode()

	def show(self, msg):
		print("\n\nfrom:", msg['from'])
		print("subject:", msg['subject'])
		print("\nbody:", self.read(msg))

	def inbox(self, count=1, criteria="UNSEEN", critarg=None, mailbox="inbox"):
		msgs = []
		self.connect(mailbox)
		for num in self.ids(criteria, critarg)[:count]:
			msgs.append(self.fetch(num))
		self.disconnect()
		return msgs

	def view(self, count=1, criteria="UNSEEN", critarg=None, mailbox="inbox"):
		for msg in self.inbox(count, criteria, critarg, mailbox):
			self.show(msg)

reader = Reader(config.mailer)
check_inbox = reader.inbox

class Scanner(object):
	def __init__(self, reader=reader):
		self.scanners = {}
		self.reader = reader
		self.ticker = rel.timeout(None, self.tick)

	def log(self, *msg):
		log("Scanner : %s"%(" ".join(msg),))

	def criteria(self, sender=None, subject=None, unseen=True):
		crits = []
		if sender:
			crits.append('FROM "%s"'%(sender,))
		if subject:
			crits.append('SUBJECT "%s"'%(subject,))
		if unseen:
			crits.append("UNSEEN")
		return "(%s)"%(" ".join(crits),)

	def scan(self, sender=None, subject=None, unseen=True, count=1, mailbox="inbox"):
		return self.check(self.criteria(sender, subject, unseen), count, mailbox)

	def check(self, crit="UNSEEN", count=1, mailbox="inbox"):
		self.log("scanning", mailbox, "for", crit)
		return self.reader.inbox(count, crit, mailbox=mailbox)

	def tick(self):
		for crit, scanner in self.scanners.items():
			msgs = self.check(crit, scanner["count"], scanner["mailbox"])
			if msgs:
				for msg in msgs:
					scanner["cb"](msg)
				del self.scanners[crit]
		return self.scanners # Falsy when empty

	def on(self, scanopts, cb=None, count=1, mailbox="inbox"):
		if not self.scanners:
			self.log("starting scanner")
			self.ticker.add(config.mailscantick)
		crit = self.criteria(scanopts)
		self.log("watching for", crit)
		self.scanners[crit] = {
			"count": count,
			"mailbox": mailbox,
			"cb": cb or self.reader.show
		}

scanner = Scanner(reader)
on_mail = scanner.on