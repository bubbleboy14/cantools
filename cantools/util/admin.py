import os
from cantools.util import cmd, output, log, set_log, close_log, read, write

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

def pcount(pname):
	log("checking count: %s"%(pname,), important=True)
	num = int(output("ps -ef | grep %s | wc -l"%(pname,)))
	log("%s count: %s"%(pname, num), 1)
	return num

def pcheck(pname, target, starter):
	if pcount(pname) != target:
		log("not enough %s processes - restarting screen!"%(pname,), 1)
		cmd("killall screen; %s"%(starter,))
		return True

def screener(ctnum=None, dpath="/root", drpnum=None, sname=None):
	os.chdir(dpath)
	set_log("scrn.log")
	log("checking screen", important=True)
	starter = _starter(sname)
	if ctnum and type(ctnum) is not int:
		ctnum = ctnum.isdigit() and int(ctnum)
	if drpnum and type(drpnum) is not int:
		drpnum = drpnum.isdigit() and int(drpnum)
	if "No Sockets found" in output("screen -list"):
		log("no screen! restarting", 1)
		cmd(starter)
	else:
		(ctnum and pcheck("ctstart", ctnum, starter)) or (drpnum and pcheck("dez_reverse_proxy", drpnum, starter))
	log("goodbye", important=True)
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

def replace(flag, swap, ext="md"):
	fz = list(filter(lambda fn : fn.endswith(ext), os.listdir()))
	log("processing %s %s files"%(len(fz), ext))
	for f in fz:
		log(f, 1)
		write(read(f).replace(flag, swap), f)
	log("goodbye!")

def json2abi(fname):
	write(read(fname, isjson=True)['abi'], fname.replace("json", "abi"), isjson=True)