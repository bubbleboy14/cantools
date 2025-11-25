import os, sys, rel, time, datetime
from cantools.util import cmd, output, error, log, set_log, close_log, read, write, confirm, rm

coremods = ["screen", "ctstart", "ctpubsub", "ctutil", "ctinit", "dez_reverse_proxy", "dez_websocket_proxy"]
installers = ["apt", "yum", "pkg", "brew"]

def _starter(sname=None):
	if sname == "None":
		sname = None
	starter = "screen -wipe ; screen -L -dm"
	return sname and "%s -S %s"%(starter, sname) or starter

def _which(*names):
	success = True
	for name in names:
		if not output("which %s"%(name,)):
			log("%s not in path!"%(name,))
			success = False
	return success

def first(*names):
	for name in names:
		if _which(name):
			log(name)
			return name

def installer():
	return first(*installers)

def install(*pkgs):
	pacman = installer()
	pline = " ".join(pkgs)
	log("using %s to install %s"%(pacman, pline), important=True)
	cmd("%s install %s"%(pacman, pline), sudo=True)

def snapinstall(pkg, classic=False):
	iline = "snap install %s"%(pkg,)
	if classic:
		iline = "%s --classic"%(iline,)
	cmd(iline, sudo=True)

def simplecfg(fname, sequential=False):
	if not os.path.exists(fname):
		return log("configuration file not found: %s"%(fname,))
	data = [] if sequential else {}
	for line in read(fname).split("\n"):
		if not line or line.startswith("#"):
			continue
		variety = "basic"
		if ":" in line:
			variety, line = line.split(":", 1)
		if sequential:
			data.append({"variety": variety, "line": line})
		else:
			if variety not in data:
				data[variety] = []
			data[variety].append(line)
	return data

def certs(dpath="/root", sname=None):
	os.chdir(dpath)
	set_log("cron-certs.log")
	log("attempting to renew certs", important=True)
	cmd('certbot renew --pre-hook "killall screen" --post-hook "%s"'%(_starter(sname),))
	log("goodbye")
	close_log()

def pcount(pname):
	log("checking count: %s"%(pname,), important=True)
	num = int(output("ps -ef | grep %s | egrep -v 'screener|pcount|grep' | wc -l"%(pname,)))
	log("%s count: %s"%(pname, num), 1)
	return num

def pcheck(pname, target, starter):
	if target and pcount(pname) != target:
		log("not enough %s processes - restarting screen!"%(pname,), 1)
		log(output("screen -Q windows"), important=True)
		cmd("killall screen; %s"%(starter,))
		return True

def pkill(pname, force=False):
	pblock = output("ps -ef | grep %s | egrep -v 'screener|pkill|grep'"%(pname,))
	if not pblock:
		log("no '%s' processes!"%(pname,))
	else:
		plines = pblock.split("\n")
		log("found %s '%s' processes"%(len(plines), pname), important=True)
		if plines:
			procs = [[w for w in line.split(" ") if w][1] for line in plines]
			if force or confirm("kill %s '%s' processes"%(len(procs), pname)):
				for proc in procs:
					cmd("kill -9 %s"%(proc,))
	log("goodbye")

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

def zipit(fname, oname=None, remove=False, keepsyms=False):
	log("zipping up %s"%(fname,), important=True)
	if keepsyms == "ask":
		keepsyms = confirm("keep symlinks", True)
	ops = keepsyms and "ry" or "r"
	oname = oname or "%s.zip"%(fname,)
	cmd("zip -%s %s %s"%(ops, oname, fname))
	remove and cmd("rm -rf %s"%(fname,))

def termap(term, default=1):
	m = {}
	terms = term.split("|")
	for key in terms:
		if ":" in key:
			key, val = key.split(":")
			val = int(val)
		else:
			val = default
		m[key] = val
	print(m)
	return m

def dedchek(logname="screenlog.0", flag="server not ready"):
	ldata = read(logname, default="")
	count = len(ldata.split(flag)) - 1
	set_log("dedchek.log")
	log("dedchek: %s"%(count,), important=True)
	if count:
		from cantools.web import email_admins
		email_admins("dedchek", "\n\n".join([
			"unresponsive count: %s"%(count,),
			"rotating log!",
			"restarting screen!"
		]))
		tstamp = str(datetime.datetime.now()).replace(" ", "_")
		dname = "%sarchive"%(logname,)
		if not os.path.isdir(dname):
			cmd("mkdir %s"%(dname,))
		cmd("mv %s %s"%(logname, os.path.join(dname, tstamp)))
		cmd("killall screen; %s"%(_starter(),))
	log("goodbye", important=True)
	close_log()

def islocked(pname): # eg "dpkg" or "apt/lists"
	unlocked = "Lock acquired"
	lpath = "/var/lib/%s/lock"%(pname,)
	log("testing %s lock at %s"%(pname, lpath))
	fbase = "flock --timeout 0 --exclusive --nonblock"
	fcmd = '%s %s -c "echo %s" || echo Lock is held'%(fbase, lpath, unlocked)
	op = output(fcmd, sudo=True, silent=True, loud=True)
	return op != unlocked

def screener(ctnum=None, dpath="/root", drpnum=None, psnum=None, sname=None, tmap=None):
	os.chdir(dpath)
	set_log("scrn.log")
	log("checking modules", important=True)
	_which(*coremods) or error("update your path!")
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
		restarted = pcheck("ctstart", ctnum, starter) or pcheck("dez_reverse_proxy", drpnum, starter) or pcheck("ctpubsub", psnum, starter)
		if tmap:
			for k, v in termap(tmap).items():
				restarted = restarted or pcheck(k, v, starter)
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

def cleanup(force=False):
	if force or confirm("garbage collect git repos"):
		gc()
	if force or confirm("vacuum up old journals"):
		cmd("journalctl --vacuum-size=50M")
	if force or confirm("remove old packages"):
		cmd("apt autoremove")
	if force or confirm("clean up screenlogs"):
		slogs = output("du -a . | sort -n -r | head -n 20 | grep screenlog")
		if slogs:
			lines = slogs.split("\n")
			paths = [l.split("\t").pop() for l in lines]
			plen = len(paths)
			log("founds %s screenlogs:\n\n%s"%(plen, "\n".join(paths)), important=True)
			if plen and (force or confirm("delete %s screenlogs"%(plen,))):
				for slog in paths:
					rm(slog)
		log("all clear!")

def matchline(oline, start=None, end=None, sudo=False, loud=True):
	for line in output(oline, sudo=sudo, loud=loud).split("\n"):
		if start and line.startswith(start):
			return line
		if end and line.endswith(end):
			return line

def sysup(upit=False, upct=False, dpath="."):
	from cantools.web import email_admins
	os.chdir(dpath)
	set_log("cron-sysup.log")
	log("updating package index", important=True)
	if islocked("dpkg") or islocked("apt/lists"):
		email_admins("can't update package list", "dpkg or apt/lists file is locked :(")
	cmd("apt update", sudo=True)
	alist = output("apt list --upgradable")
	adrep = []
	if alist.endswith("Listing..."):
		adrep.append("no system updates available")
	else:
		ublock = alist.split("Listing...\n").pop()
		ulist = ublock.split("\n")
		ulen = len(ulist)
		log("%s upgrades available"%(ulen,))
		adrep.append("%s system updates %s:"%(ulen, upit and "attempted" or "available"))
		adrep.append(ublock)
		if upit:
			log("upgrading %s packages"%(ulen,), important=True)
			adrep.append(matchline("apt upgrade -y", end=" not upgraded.", sudo=True))
	if upct:
		adrep.append("updating web framework and plugins")
		fullupline = matchline("ctinit -du", "Successfully installed ")
		fullupline and adrep.append(fullupline)
	shouldReboot = False
	if os.path.exists("/var/run/reboot-required"):
		upaks = output("cat /var/run/reboot-required.pkgs", loud=True)
		adrep.append("updates include: %s"%(upaks,))
		adrep.append("system restart required!")
		if upit == "auto":
			shouldReboot = True
			adrep.append("restarting system!")
	if adrep:
		adrep = "\n\n".join(adrep)
		log(adrep, important=True)
		email_admins("system updates", adrep)
	log("goodbye")
	shouldReboot and reboot()
	close_log()

def reboot(wait=5):
	log("rebooting in %s seconds!"%(wait,))
	if wait:
		time.sleep(int(wait))
	cmd("reboot")

def running(proc):
	if not "active (running)" in output("service %s status"%(proc,)):
		return log("%s isn't running!!!"%(proc,))
	log("%s is running"%(proc,))
	return True

def upcheck(*procs):
	from cantools.web import email_admins
	set_log("cron-upcheck.log")
	log("checking services: %s"%(", ".join(procs),), important=True)
	restarts = []
	for proc in procs:
		if not running(proc):
			restarts.append(proc)
			log("restarting %s!"%(proc,), important=True)
			servicer(proc)
	restarts and email_admins("services restarted", "\n\n".join(restarts))
	log("goodbye")
	close_log()

def vitals(clean=False, thresh=90, dpath=".", conlim=0):
	from cantools.web import email_admins
	if clean == "False":
		clean = False
	thresh = int(thresh)
	conlim = int(conlim)
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
	if conlim:
		concount = int(output("lsof -i | wc -l"))
		lz.append("connections: %s"%(concount,))
	for l in lz:
		log(l)
	if hdrive > thresh or inodes > thresh or memuse > thresh or (conlim and concount > conlim):
		log("threshold exceeded - notifying admins")
		if hdrive > thresh and clean:
			log("cleaning up!")
			cleanup(True)
			lz.append("cleaned up hard drive!")
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
	from cantools.web import shield
	from cantools import config
	shield.setBlacklist()
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

def enc(fname, oname=None, nowrite=False, asdata=False, nolog=False, replace=None):
	from cantools.web import enc as wenc
	oname = oname or fname.replace("txt", "enc")
	nolog or log("enc(%s -> %s) nowrite=%s"%(asdata and "data" or fname, oname, nowrite))
	data = asdata and fname or read(fname)
	if replace: # tuple
		rfrom, rto = replace
		data = data.replace(rfrom, rto)
	enced = wenc(data)
	nowrite or write(enced, oname)
	return enced

def dec(fname, oname=None, nowrite=False, asdata=False, nolog=False, replace=None):
	from cantools.web import dec as wdec
	oname = oname or fname.replace("enc", "txt")
	nolog or log("dec(%s -> %s) nowrite=%s"%(asdata and "data" or fname, oname, nowrite))
	deced = wdec(asdata and fname or read(fname))
	if replace: # tuple
		rfrom, rto = replace
		deced = deced.replace(rfrom, rto)
	nowrite or write(deced, oname)
	return deced

def qenc(fname, asdata=False, nolog=True):
	enced = enc(fname, nowrite=True, asdata=asdata, nolog=nolog)
	print(enced)
	return enced

def qdec(fname, asdata=False, nolog=True):
	deced = dec(fname, nowrite=True, asdata=asdata, nolog=nolog)
	print(deced)
	return deced

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
		rel.signal(2, rel.abort)
		rel.timeout(1, self.creep)
		rel.dispatch()

def memcreep(total=120, mid=40, short=10):
	Creeper(int(total), int(mid), int(short))

def phpver():
	if not _which("php"): return
	v = output("php -v")[4:7]
	log(v)
	return v

def javaver():
	if not _which("javac"): return
	v = output("javac -version")[6:8]
	log(v)
	return v

def withtmp(fdata, fun, owner=None, fname="_tmp"):
	write(fdata, fname)
	owner and cmd("chown %s:%s %s"%(owner, owner, fname), True)
	fun()
	os.remove(fname)

def servicer(proc, action="restart", sycon="service", ask=False):
	if ask and not confirm("%s %s"%(action, proc)):
		return
	if sycon == "service":
		conline = "service " + proc + " %s"
	else: # systemctl
		conline = "systemctl %s " + proc
	cmd(conline%(action,))

def whilestopped(proc, fun, sycon="service", starter="start"):
	servicer(proc, "stop", sycon)
	fun()
	servicer(proc, starter, sycon)

# mysql stuff...

MYSQL_ALTERP = "ALTER USER '%s'@'%s' IDENTIFIED BY '%s';"
MYSQL_RESET = """flush privileges;
ALTER USER '%s'@'%s' IDENTIFIED BY '%s';"""
MYSQL_CREATE_USER = """FLUSH PRIVILEGES;
CREATE USER '%s'@'%s' IDENTIFIED BY '%s';
GRANT ALL PRIVILEGES ON *.* TO '%s'@'%s' WITH GRANT OPTION;
FLUSH PRIVILEGES;"""
MYSQL_USERS = """select User,Host from mysql.user;"""

def mysqltmp(fdata, fun, owner="mysql", sycon="service", starter="start"):
	withtmp(fdata, lambda : whilestopped("mysql", fun, sycon, starter), owner)

def mysqlsafe(fname="_tmp", user="root"):
#	output("mysqld_safe --skip-grant-tables &", loud=True)
	cmd("mysqld --skip-grant-tables --skip-networking -u %s &"%(user,))
	time.sleep(0.5)
	o = output("mysql < %s"%(fname,), loud=True)
	cmd("killall mysqld")
	return o

def mysqlreset(user="root", hostname="localhost", password=None):
	password = password or input("new password for '%s' user? "%(user,))
	mysqltmp(MYSQL_ALTERP%(user, hostname, password),
		lambda : cmd("mysqld -init-file=_tmp"))

def mysqlresetnp(user="root", hostname="localhost", password=None):
	password = password or input("new password for '%s' user? "%(user,))
	mysqltmp(MYSQL_RESET%(user, hostname, password), mysqlsafe)

def mysqluser(user="root", hostname="localhost", password=None):
	log("creating mysql user: %s@%s"%(user, hostname), important=True)
	password = password or input("new password for '%s' user? "%(user,))
	mysqltmp(MYSQL_CREATE_USER%(user, hostname,
		password, user, hostname), mysqlsafe)

def mysqlexists(user="root", hostname="localhost", ensure=False):
	log("checking for user '%s' at hostname '%s'"%(user, hostname), important=True)
	for uline in mysqlsafe().split("\n"):
		u, h = uline.split("\t")
		if u == user and h == hostname:
			log("user found!", important=True)
			return True
	log("user not found :(", important=True)
	if ensure == "ask":
		ensure = confirm("create %s@%s mysql user"%(user, hostname), True)
	ensure and mysqluser(user, hostname)

def mysqlcheck(user="root", hostname="localhost", ensure=False):
	mysqltmp(MYSQL_USERS, lambda : mysqlexists(user, hostname, ensure))

# ccbill stuff...

def _getmems(fname, simple=True, count=False, xls=False, tsv=False):
	from cantools.util.data import getcsv, gettsv, getxls
	members = {}
	if xls:
		rows = getxls(read(fname))
	elif tsv:
		rows = gettsv(read(fname))
	else:
		rows = getcsv(fname)
	for row in rows:
		if simple:
			members[row[14].lower()] = row[3]
		else: # diff (obsolete?) report format...
			members[row[8]] = count or {
				"date": row[13],
				"status": row[15],
				"initial_price": row[16],
				"initial_period": row[17],
				"recurring_price": row[18],
				"recurring_period": row[19],
				"rebills": row[20]
			}
	if count:
		return len(list(members.keys()))
	return members

def getCCmems(fname="active-members.csv", simple=True, count=False):
	try:
		mems = _getmems(fname, simple, count)
	except:
		log("getmems: csv read failed - trying tsv")
		try:
			mems = _getmems(fname, simple, count, tsv=True)
		except:
			log("getmems: tsv read failed - trying xls")
			mems = _getmems(fname, simple, count, xls=True)
	return mems

def ccbreport(fpath):
	from cantools.web import fetch
	from cantools.util import cp
	from cantools import config
	username = config.cache("datalink username? ")
	password = config.cache("datalink password? ")
	accnum = config.cache("datalink account number? ")
	data = fetch("datalink.ccbill.com", "/data/main.cgi", timeout=10, protocol="https", qsp={
		"clientSubacc": "0000",
		"username": username,
		"password": password,
		"clientAccnum": accnum,
		"transactionTypes": "ACTIVEMEMBERS"
	}).decode()
	cp(data, fpath)

def ccbmems():
	fn = str(datetime.datetime.now()).split(" ").pop(0).replace("-", "") + ".csv"
	fp = os.path.join("activemembers", fn)
	log("checking for ccbill report at %s"%(fp,))
	if not os.path.exists(fp):
		log("file not present - acquiring from ccbill")
		ccbreport(fp)
	return getCCmems(fp)