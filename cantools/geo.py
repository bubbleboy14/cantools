import os, urllib
from cantools.web import fetch
from cantools.util import log, read, write, writejson
from cantools import config

zcpath = os.path.join("logs", "json", "geo")

class Geo(object):
	apis = {
		"latlng": {
			"user": "google",
			"host": "maps.googleapis.com",
			"path": "/maps/api/geocode/json?sensor=false&address={0}",
			"sig": "key",
			"property": "results",
			"index": 0
		},
		"zip": {
			"geonames": {
				"user": "geonames",
				"host": "ws.geonames.org",
				"path": "/findNearbyPostalCodesJSON?radius=1&lat={0}&lng={1}",
				"sig": "username",
				"property": "postalCodes",
				"index": 0
			},
			"google": {
				"user": "google",
				"host": "maps.googleapis.com",
				"path": "/maps/api/geocode/json?sensor=false&latlng={0},{1}",
				"sig": "key",
				"property": "results",
				"index": 0
			}
		}[config.geo.zip]
	}

	def __init__(self):
		self.cache = read("%s.json"%(zcpath,), isjson=True, default={})
		for addr in self.cache:
			self.cache[addr]["count"] = 0

	def _no_cache(self, addr):
		return not (addr in self.cache and self.cache[addr]["lat"] and self.cache[addr]["lng"])

	def _fetch(self, api, *args): # api is latlng/zip
		path = self.apis[api]["path"].format(*[urllib.quote(str(a).replace(" ", "+")) for a in args])
		host = self.apis[api]["host"]
		user = self.apis[api]["user"]
		prop = self.apis[api]["property"]
		keys = config.geo.user[user]
		onum = num = self.apis[api]["index"]
		sig = self.apis[api]["sig"]
		kwargs = { "asjson": True }
		result = []
		while True:
			fullpath = path
			if keys[num]:
				fullpath += "&%s=%s"%(sig, keys[num])
				if user == "google":
					kwargs["protocol"] = "https"
			raw = fetch(host, fullpath, **kwargs)
			result = raw.get(prop, [])
			if len(result):
				break
			log("0-length %s result (got: '%s') - changing user"%(api, raw), important=True)
			num = (num + 1) % len(keys)
			if num == onum:
				log("exhausted key list -- returning [] :'(")
				break
		self.apis[api]["index"] = num
		return result

	def address2latlng(self, address):
		if self._no_cache(address):
			log("finding lat/lng for %s"%(address,), 3)
			results = self._fetch("latlng", address)
			if not len(results):
				log("no results!!!", 4)
				self.cache[address] = {
					"lat": None,
					"lng": None
				}
			else:
				loc = results[0]['geometry']['location']
				self.cache[address] = {
					"lat": loc["lat"],
					"lng": loc["lng"]
				}
			self.savecache()
		return [self.cache[address]['lat'], self.cache[address]['lng']]

	def latlng2zip(self, lat, lng):
		result = self._fetch("zip", lat, lng)
		log("finding zip for lat %s and lng %s"%(lat, lng), 3)
		if not len(result):
			log("can't find zipcode!!!", important=True)
			return None
		if config.geo.zip == "google":
			return [c["short_name"] for c in result[0]["address_components"] if c["types"][0] == "postal_code"][0]
		return result[0]["postalCode"]

	def addr2zip(self, addr, allowNone=False):
		log("finding zip for '%s'"%(addr,), 3)
		if config.geo.test:
			log("test mode! returning nonsense :)")
			return '12345'
		if self._no_cache(addr):
			self.address2latlng(addr)
		d = self.cache[addr]
		if not d.get("zip", allowNone):
			d["count"] = 1
			d["zip"] = d["lat"] and self.latlng2zip(d["lat"], d["lng"])
			self.savecache()
		else:
			d["count"] += 1
			log("address referenced %s times"%(d["count"],), 4)
		log("found zip: %s"%(d["zip"],), 4)
		return d["zip"]

	def savecache(self, pretty=False):
		log("saving zipcode / latlng (geo) cache (pretty: %s)"%(pretty,), important=True)
		if pretty:
			writejson(self.cache, zcpath)
		else:
			write(self.cache, "%s.json"%(zcpath,), True)

geo = Geo()
address2latlng = geo.address2latlng
latlng2zip = geo.latlng2zip
addr2zip = geo.addr2zip
savecache = geo.savecache