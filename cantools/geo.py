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

	def address2latlng(self, address):
		if address not in self.cache:
			log("finding lat/lng for %s"%(address,), 3)
			results = fetch("maps.googleapis.com",
		        "/maps/api/geocode/json?sensor=false&address=%s"%(urllib.quote(address.replace(" ", "+")),),
		        asjson=True)['results']
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
			"/findNearbyPostalCodesJSON?radius=1&username=marbar&lat=%s&lng=%s"%(lat, lng), asjson=True)
		log("finding zip for lat %s and lng %s. result: %s"%(lat, lng, json.dumps(result)), 3)
		if not len(result["postalCodes"]):
			log("can't find zipcode!!!", important=True)
			return None
		return result["postalCodes"][0]["postalCode"]

	def addr2zip(self, addr):
		log("finding zip for '%s'"%(addr,), 3)
		if config.geo.test:
			log("test mode! returning nonsense :)")
			return '12345'
		if addr not in self.cache:
			self.address2latlng(addr)
		d = self.cache[addr]
		if "zip" not in d:
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