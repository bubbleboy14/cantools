import pymysql
from cantools.util import log, read, error

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

try:
	_db = DBWrapper()
except:
	log("NO DATABASE CONNECTION!!!!!", important=True)

def getdb(subdb=False):
	return subdb and _db.db() or _db

def dbcommit():
	_db.commit()

def query(q, fetch=True, silent=False):
	return _db.query(q, fetch, silent)

def memprop(email, prop):
	res = query("select %s from wp_users where user_email = '%s';"%(prop, email))
	if not res:
		error("no matching member: %s"%(email,))
	return res[0][0]

def memid(email):
	return memprop(email, "ID")

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