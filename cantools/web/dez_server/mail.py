from catmail import Mailer, Reader, Scanner
from catmail import config as catfyg
from ..util import config

catfyg.set({
	"html": config.mailhtml,
	"gmailer": config.gmailer,
	"scantick": config.mailscantick,
	"verbose": config.mailoud,
	"cache": config.cache
})
catfyg.admin.update("contacts", config.admin.contacts)
catfyg.admin.update("reportees", config.admin.reportees)

mailer = Mailer(config.mailer, config.mailername)
send_mail = mailer.mail
email_admins = mailer.admins
email_reportees = mailer.reportees

reader = Reader(config.mailer)
check_inbox = reader.inbox

scanner = Scanner(reader)
on_mail = scanner.on