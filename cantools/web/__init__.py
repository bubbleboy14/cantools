from cantools import config

if config.web.server == "gae":
	from .gae_server import *
elif config.web.server == "dez":
	from .bw import *
	from babyweb import *
	from babyweb import mail
	from babyweb.sms import send_sms
	from babyweb.mail import send_mail, email_admins, email_reportees, mailer, reader, check_inbox, scanner, on_mail
else:
	from cantools import util
	util.error("no web server specified")