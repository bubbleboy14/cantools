from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///:memory:', echo=True)
session = sessionmaker(bind=engine)()

put_multi = session.add_all
def delete_multi(instances):
	for instance in instances:
		instance.rm()

class Query(object):
	def __init__(self, mod, *args, **kwargs):
		self.query = session.query(mod)
		self.count = self.query.count
		self.get = self.query.get
		self.all = self.query.all
		self.first = self.query.first
		self.order = self.query.order_by
		self.filter = self.query.filter
		self.filter(*args) # kwargs?

	def fetch(self, limit, offset=0, keys_only=False):
		self.query.limit(limit)
		if offset:
			self.query.offset(offset)
		res = self.all()
		if keys_only: # best way?
			return [r.key for r in res]
		return res