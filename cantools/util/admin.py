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