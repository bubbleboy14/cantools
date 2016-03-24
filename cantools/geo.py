import os, urllib, json
from cantools.web import fetch
from cantools.util import log, read, writejson
from cantools import config

zcpath = os.path.join("logs", "json", "geo")

class Geo(object):
	def __init__(self):
		self.cache = read("%s.json"%(zcpath,), isjson=True, default={})
		for addr in self.cache:
			self.cache[addr]["count"] = 0

	def _no_cache(self, addr):
		return not (addr in self.cache and self.cache[addr]["lat"] and self.cache[addr]["lng"])

	def address2latlng(self, address):
		if self._no_cache(address):
			log("finding lat/lng for %s"%(address,), 3)
			kwargs = { "asjson": True }
			path = "/maps/api/geocode/json?sensor=false&address=%s"%(urllib.quote(address.replace(" ", "+")),)
			if config.geo.user.google:
				path += "&key=%s"%(config.geo.user.google,)
				kwargs["protocol"] = "https"
			results = fetch("maps.googleapis.com", path, **kwargs)['results']
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
		result = fetch("ws.geonames.org",
			"/findNearbyPostalCodesJSON?radius=1&username=%s&lat=%s&lng=%s"%(config.geo.user.geonames, lat, lng), asjson=True)
		log("finding zip for lat %s and lng %s. result: %s"%(lat, lng, json.dumps(result)), 3)
		if not len(result["postalCodes"]):
			log("can't find zipcode!!!", important=True)
			return None
		return result["postalCodes"][0]["postalCode"]

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

	def savecache(self):
		log("saving zipcode / latlng (geo) cache", important=True)
		writejson(self.cache, zcpath)

geo = Geo()
address2latlng = geo.address2latlng
latlng2zip = geo.latlng2zip
addr2zip = geo.addr2zip
savecache = geo.savecache