def getxls(data, name=None, parse=True):
	import xlrd, datetime
	wb = xlrd.open_workbook(file_contents=data)
	s = wb.sheet_by_name(name or wb.sheet_names()[0])
	if not parse:
		return s
	d = [[c.value for c in s.row(0)]]
	for r in range(1, s.nrows):
		row = s.row(r)
		rl = []
		for c in row:
			if c.ctype == 3: # date
				rl.append(datetime.datetime(*xlrd.xldate_as_tuple(c.value, wb.datemode)))
			else:
				rl.append(c.value)
		d.append(rl)
	return d

def _svlines(data):
	return data.replace("\r\n", "\n").replace("\r", "\n").split("\n")

def gettsv(data):
	return [l.split("\t") for l in _svlines(data) if l]

def getcsv_from_data(data): # deprecated! doesn't work _that_ well.
	return [l.split(",") for l in _svlines(data) if l]

# eh, module reads it better sometimes (especially if we write(_svlines(read())) first)
def getcsv(fname):
	import csv
	d = []
	f = open(fname, "rU")
	reader = csv.reader(f)
	for row in reader:
		d.append(row)
	f.close()
	return d

def flatten(obj):
	keys = []
	vals = []
	for key, val in list(obj.items()):
		if isinstance(val, dict):
			subkeys, subvals = flatten(val)
			for subkey in subkeys:
				fullsubkey = "%s.%s"%(key, subkey)
				if fullsubkey not in keys:
					keys.append(fullsubkey)
			vals += subvals
		else:
			if key not in keys:
				keys.append(key)
			vals.append(val)
	return keys, vals

def arr2csv(arr):
	return "\n".join([",".join(flatten(arr[0])[0])] + [",".join([str(i) for i in flatten(obj)[1]]) for obj in arr])

def batch(dlist, f, *args, **kwargs):
	chunk = kwargs.pop("chunk", 1000)
	i = 0
	while i < len(dlist):
		f(dlist[i:i+chunk], *args, **kwargs)
		i += chunk

def token(n=10):
	import random, string
	return "".join(random.sample(string.ascii_uppercase + string.digits, n))

# below (props, drower, tsv) for tsv dumping
def props(mod):
	from model import db
	s = db.get_schema(mod)
	return filter(lambda p : p not in mod._data_omit and p not in ["index",
		"key"] and not p.startswith("_") and s[p] != "blob", s.keys())

def dcell(e, p):
	v = getattr(e, p)
	t = e._schema[p]
	if t == "key":
		v = v and v.get().labeler() or None
	elif t == "keylist":
		from model import db
		v = v and [i.labeler() for i in db.get_multi(v)] or []
	return '"%s"'%(str(v),)

def drower(e, pz):
	return map(lambda p : dcell(e, p), pz)

def rgen(ents, pz, rower=None):
	rower = rower or drower
	return [pz] + map(lambda e : rower(e, pz), ents)

def tsv(ents, pz, rower=None):
	return "\n".join(map(lambda r : "\t".join(r),
		rgen(ents, pz, rower)))

def ez2csv(ents, pz, rower=None):
	return "\n".join(map(lambda r : ",".join(r),
		rgen(ents, pz, rower)))

def spreadsheet(fmat, ents, pz, rower=None):
	return (fmat == "tsv" and tsv or ez2csv)(ents, pz, rower)