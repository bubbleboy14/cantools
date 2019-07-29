from .mail import send_mail
from cantools import config

carriers = {
	'at&t': 'mms.att.net',
	'verizon': 'vtext.com',
	'tmobile': 'tmomail.net',
	'sprint': 'page.nextel.com'
}

def send_sms(number, subject="hello", body="goodbye", carrier="at&t"):
	send_mail(to="%s@%s"%(number, carriers[carrier]), subject=subject, body=body)