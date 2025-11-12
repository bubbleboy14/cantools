import pymysql, time
from fyg.util import log, read, error

class DBWrapper(object):
	def __init__(self):
		self._h, self._u, self._p, self._d = read(".c").strip().split("|")

	def db(self):
		try:
			self._db.ping()
		except:
			self._db = pymysql.connect(host=self._h,
				user=self._u, passwd=self._p, db=self._d)
		return self._db

	def query(self, q, fetch=True, silent=False):
		silent or log("executing query: %s"%(q,))
		db = self.db()
		cur = db.cursor()
		cur.execute(q)
		if fetch:
			rowz = cur.fetchall()
		cur.close()
		if fetch:
			return rowz

	def commit(self):
		self.db().commit()

_db = None

def setdb():
	global _db
	if not _db:
		try:
			_db = DBWrapper()
		except:
			log("NO DATABASE CONNECTION!!!!!", important=True)
	return _db

setdb()

def trydb(attempts=5, wait=0.4):
	for attempt in range(attempts):
		db = setdb()
		if db:
			return db
		log("trydb failed retry #%s"%(attempt,), important=True)
		time.sleep(wait)

def getdb(subdb=False):
	db = trydb()
	return subdb and db.db() or db

def dbcommit():
	getdb().commit()

def query(q, fetch=True, silent=False):
	return getdb().query(q, fetch, silent)

def memprop(email, prop):
	res = query("select %s from wp_users where user_email = '%s';"%(prop, email))
	if not res:
		error("no matching member: %s"%(email,))
	return res[0][0]

def memid(email):
	return memprop(email, "ID")

def getmeta(pid, key):
	return query("select meta_value from wp_usermeta where user_id = '%s' and meta_key = '%s';"%(pid, key))

def setmeta(pid, key, val):
	mres = query("select * from wp_usermeta where user_id = '%s' and meta_key = '%s';"%(pid, key))
	if mres:
		query("update wp_usermeta set meta_value = '%s' where umeta_id = '%s';"%(val, mres[0][0]), False)
	else:
		query("insert into wp_usermeta(user_id,meta_key,meta_value) values(%s,'%s','%s');"%(pid, key, val), False)

def transmeta(pid, key, transformer):
	mres = query("select * from wp_usermeta where user_id = '%s' and meta_key = '%s';"%(pid, key))
	mid, uid, k, v = mres[0]
	val = transformer(v)
	query("update wp_usermeta set meta_value = '%s' where umeta_id = '%s';"%(val, mid), False)

def bymeta(key, val, props=["user_email"], like=True):
	cond = (like and "like '%%%s%%'" or "= '%s'")%(val,)
	q = "select %s from wp_users join wp_usermeta on wp_users.ID = wp_usermeta.user_id where wp_usermeta.meta_key = '%s' and wp_usermeta.meta_value %s;"%(", ".join(props), key, cond)
	return query(q)

def capability2emails(capability):
	return [row[0] for row in bymeta("wp_capabilities", capability)]

def id2email(memid):
	e = query("select user_email from wp_users where ID = '%s';"%(memid,))
	return e and e[0][0] or "[account %s not found]"%(memid,)

def ip2mems(ip):
	return [id2email(m[0]) for m in query("select user_id from wp_usermeta where meta_value = '%s';"%(ip,))]