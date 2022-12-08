import os
from cantools.util import cmd, output, log, set_log, close_log

def _starter(sname):
	starter = "screen -L -dm"
	return sname and "%s -S %s"%(starter, sname) or starter

def certs(dpath="/root", sname=None):
	os.chdir(dpath)
	set_log("cron-certs.log")
	log("attempting to renew certs", important=True)
	cmd('certbot renew --pre-hook "killall screen" --post-hook "%s"'%(_starter(sname),))
	log("goodbye")
	close_log()

def screener(ctnum=None, dpath="/root", sname=None):
	os.chdir(dpath)
	set_log("scrn.log")
	log("checking screen", important=True)
	starter = _starter(sname)
	if ctnum and type(ctnum) is not int:
		ctnum = ctnum.isdigit() and int(ctnum)
	if "No Sockets found" in output("screen -list"):
		log("no screen! restarting", 1)
		cmd(starter)
	elif ctnum:
		log("checking count", important=True)
		num = int(output("ps -ef | grep ctstart | wc -l"))
		log("ctstarts: %s"%(num,), 1)
		if num != ctnum:
			log("not enough ctstarts! restarting", 1)
			cmd("killall screen; %s"%(starter,))
	log("goodbye")
	close_log()

def check(cmd="df"):
	oz = output(cmd).split("\n")
	for o in oz:
		if o.endswith("/"):
			return int(o.rsplit(" ", 2)[1][:-1])

def vitals(dpath="/root", thresh=90):
	from cantools.web import email_admins
	os.chdir(dpath)
	set_log("cron-vitals.log")
	log("scanning vitals", important=True)
	lz = []
	hdrive = check()
	lz.append("hard drive usage: %s%%"%(hdrive,))
	inodes = check("df -i")
	lz.append("inode usage: %s%%"%(inodes,))
	memuse = float(output("free | grep Mem | awk '{print $3/$2 * 100.0}'"))
	lz.append("memory usage: %s%%"%(memuse,))
	for l in lz:
		log(l)
	if hdrive > thresh or inodes > thresh or memuse > thresh:
		log("threshold exceeded - notifying admins")
		email_admins("threshold exceeded", "\n".join(lz))
	log("goodbye")
	close_log()

def sslredirect(port=80):
	from dez.http.reverseproxy import startreverseproxy
	from cantools.config import Config
	startreverseproxy(Config({
		"port": port,
		"ssl_redirect": "auto"
	}))