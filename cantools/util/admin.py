import os, sys
from cantools.util import cmd, output, error, log, set_log, close_log, read, write, confirm, rm

def _starter(sname):
	starter = "screen -L -dm"
	return sname and "%s -S %s"%(starter, sname) or starter

def _which(names):
	success = True
	for name in names:
		if not output("which %s"%(name,)):
			log("%s not in path!"%(name,))
			success = False
	return success

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
	if target and pcount(pname) != target:
		log("not enough %s processes - restarting screen!"%(pname,), 1)
		log(output("screen -Q windows"), important=True)
		cmd("killall screen; %s"%(starter,))
		return True

coremods = ["screen", "ctstart", "ctpubsub", "ctutil", "dez_reverse_proxy", "dez_websocket_proxy"]

def binpath(bpath="/usr/bin/"):
	log("checking %s core modules"%(len(coremods),), important=True)
	missings = []
	for name in coremods:
		mpath = "%s%s"%(bpath, name)
		log("checking %s"%(name,), 1)
		if not os.path.exists(mpath):
			mloc = output("which %s"%(name,))
			mloc or error("%s not installed"%(name,))
			log("%s not in %s - found at %s instead"%(name, bpath, mloc))
			missings.append(mloc)
	if missings and confirm("symlink %s modules to %s"%(len(missings), bpath)):
		os.chdir(bpath)
		for mloc in missings:
			cmd("ln -s %s"%(mloc,))
	log("goodbye", important=True)

def postup():
	from cantools.util.package import refresh_plugins
	refresh_plugins()
	binpath()

def screener(ctnum=None, dpath="/root", drpnum=None, psnum=None, sname=None):
	os.chdir(dpath)
	set_log("scrn.log")
	log("checking modules", important=True)
	_which(coremods) or error("update your path!")
	starter = _starter(sname)
	if ctnum and type(ctnum) is not int:
		ctnum = ctnum.isdigit() and int(ctnum)
	if drpnum and type(drpnum) is not int:
		drpnum = drpnum.isdigit() and int(drpnum)
	if psnum and type(psnum) is not int:
		psnum = psnum.isdigit() and int(psnum)
	if "No Sockets found" in output("screen -list"):
		log("no screen! restarting", 1)
		cmd(starter)
	else:
		pcheck("ctstart", ctnum, starter) or pcheck("dez_reverse_proxy", drpnum, starter) or pcheck("ctpubsub", psnum, starter)
	log("goodbye", important=True)
	close_log()

def check(cmd="df"):
	oz = output(cmd).split("\n")
	for o in oz:
		if o.endswith("/"):
			return int(o.rsplit(" ", 2)[1][:-1])

def plugdirs(cb, pdir=".ctplug", filt="ct", ask=True):
	opath = os.path.abspath(".")
	os.chdir(pdir)
	pz = os.listdir(".")
	log("%s items in directory"%(len(pz),))
	if filt:
		pz = list(filter(lambda name : name.startswith(filt), pz))
	log("found %s plugins:\n\n%s"%(len(pz), "\n".join(pz)))
	if ask and not confirm("process %s plugins"%(len(pz),), True):
		return
	for p in pz:
		log(p)
		os.chdir(p)
		cb()
		os.chdir("..")
	os.chdir(opath)

def gc(pdir=".ctplug", filt="ct", ask=False):
	plugdirs(lambda : cmd("git gc"), pdir, filt, ask)

def cleanup():
	if confirm("garbage collect git repos"):
		gc()
	if confirm("vacuum up old journals"):
		cmd("journalctl --vacuum-size=50M")
	if confirm("remove old packages"):
		cmd("apt autoremove")
	if confirm("clean up screenlogs"):
		slogs = output("du -a . | sort -n -r | head -n 20 | grep screenlog")
		if slogs:
			lines = slogs.split("\n")
			paths = [l.split("\t").pop() for l in lines]
			plen = len(paths)
			log("founds %s screenlogs:\n\n%s"%(plen, "\n".join(paths)), important=True)
			if plen and confirm("delete %s screenlogs"%(plen,)):
				for slog in paths:
					rm(slog)
		log("all clear!")

def matchline(oline, start=None, end=None, sudo=False):
	for line in output(oline, sudo=sudo).split("\n"):
		if start and line.startswith(start):
			return line
		if end and line.endswith(end):
			return line

def sysup(upit=False, upct=False, dpath="."):
	from cantools.web import email_admins
	os.chdir(dpath)
	set_log("cron-sysup.log")
	log("updating package index", important=True)
	cmd("apt update", sudo=True)
	alist = output("apt list --upgradable")
	adrep = []
	if alist.endswith("Listing..."):
		adrep.append("no system updates available")
	else:
		ublock = alist.split("Listing...\n").pop()
		ulist = ublock.split("\n")
		ulen = len(ulist)
		kern = "linux" in ublock
		log("%s upgrades available"%(ulen,))
		kern and log("new kernel available!", important=True)
		if upit == "auto":
			upit = not kern
		adrep.append("%s system updates %s:"%(ulen, upit and "attempted" or "available"))
		adrep.append(ublock)
		if upit:
			log("upgrading %s packages"%(ulen,), important=True)
			adrep.append(matchline("apt upgrade -y", end=" not upgraded.", sudo=True))
	if upct:
		adrep.append("updating web framework and plugins")
		fullupline = matchline("ctinit -du", "Successfully installed ")
		fullupline and adrep.append(fullupline)
	if os.path.exists("/var/run/reboot-required"):
		upaks = output("cat /var/run/reboot-required.pkgs", loud=True)
		adrep.append("updates include: %s"%(upaks,))
		adrep.append("system restart required!")
	if adrep:
		adrep = "\n\n".join(adrep)
		log(adrep, important=True)
		email_admins("system updates", adrep)
	log("goodbye")
	close_log()

def vitals(thresh=90, dpath="."):
	from cantools.web import email_admins
	os.chdir(dpath)
	set_log("cron-vitals.log")
	log("scanning vitals", important=True)
	lz = []
	hdrive = check()
	thresh = int(thresh)
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

def blacklist(ip):
	if not confirm("blacklist %s?"%(ip,)):
		return log("okay, bye!")
	from cantools.web import controller
	from cantools import config
	controller.setBlacklist()
	blist = config.web.blacklist.obj()
	if ip in blist:
		return log("%s is already blacklisted! reason: %s"%(ip, blist[ip]))
	log("adding %s to black.list"%(ip,))
	blist[ip] = input("reason? [default: 'manual ban'] ") or "manual ban"
	log("saving black.list")
	write(blist, "black.list", isjson=True)
	confirm("restart screen?") and cmd("killall screen ; screen -L")

def replace(flag, swap, ext="md"):
	fz = list(filter(lambda fn : fn.endswith(ext), os.listdir()))
	log("processing %s %s files"%(len(fz), ext))
	for f in fz:
		log(f, 1)
		write(read(f).replace(flag, swap), f)
	log("goodbye!")

def json2abi(fname):
	write(read(fname, isjson=True)['abi'], fname.replace("json", "abi"), isjson=True)

def ushort(url):
	from cantools import config
	csl = config.shortlinker
	if not csl:
		error("no shortlinker configured")
	from urllib.parse import quote
	from cantools.web import fetch
	code = fetch("https://%s?u=%s"%(csl, quote(url)), ctjson=True)
	print("code:", code)
	return "https://%s?k=%s"%(csl, code)

class Creeper(object):
	def __init__(self, total=120, mid=40, short=10):
		self.total = total
		self.mid = mid
		self.short = short
		self.duration = 0
		self.last = None
		self.diffs = []
		self.diff = 0
		self.start()

	def signed(self, num):
		num = round(num, 2)
		return num < 0 and num or "+%s"%(num,)

	def pad(self, s, target=10):
		ls = len(s)
		if ls < target:
			return "%s%s"%(s, " " * (target - ls))
		return s

	def ave(self, size=None):
		dz = self.diffs
		if size == "diff":
			diff = self.diff
		elif size == "cur":
			diff = dz[-1]
		else:
			if size:
				nums = dz[-size:]
			else:
				nums = dz
				size = len(dz)
			diff = sum(nums) / size
			size = "%ss"%(size,)
		return self.pad("%s: %s"%(size, self.signed(diff)))

	def calc(self, diff):
		self.diff += diff
		dz = self.diffs
		dz.append(diff)
		if len(dz) > self.total:
			dz.pop(0)
		dl = len(dz)
		parts = [self.ave("cur")]
		if dl > 1:
			if dl > self.short:
				parts.append(self.ave(self.short))
				if dl > self.mid:
					parts.append(self.ave(self.mid))
			parts.append(self.ave())
		parts.append(self.ave("diff"))
		return " ; ".join(parts)

	def creep(self):
		self.duration += 1
		current = int(output("free | grep Mem | awk '{print $3}'", silent=True))
		if self.last:
			print("dur: %s ; %s"%(self.duration, self.calc(current - self.last)))
		self.last = current
		return True

	def start(self):
		import rel
		rel.signal(2, rel.abort)
		rel.timeout(1, self.creep)
		rel.dispatch()

def memcreep(total=120, mid=40, short=10):
	Creeper(int(total), int(mid), int(short))