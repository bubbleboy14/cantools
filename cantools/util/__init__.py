from io import read, write, writejson
from reporting import set_log, close_log, log, set_error, error, start_timer, end_timer
from system import cp, sym, mkdir, rm, cmd
from data import getxls, gettsv, getcsv, getcsv_from_data, flatten, arr2csv, batch

def init_gae():
	try:
		import google
	except: # running outside of dev_appserver
		import os, sys
		gae_p = None
		for p in os.environ["PATH"].split(":"):
			if p.endswith("google_appengine"):
				gae_p = p
				break
		if not gae_p:
			error("can't find google_appengine in path! please add and retry.")
		sys.path.append(gae_p)
		import dev_appserver
		dev_appserver.fix_sys_path()
		sys.path.insert(0, ".")

# these are essentially not recommended. google's
# rules for operating outside of their native environment
# are crappy and generally get worse with time. these
# _sort of_ work, but easily get messed up. if you want
# to do something remote, just write a web handler that
# does it for you.
def init_remote_ndb():
	from cantools import config
	from google.appengine.ext.remote_api import remote_api_stub
	remote_api_stub.ConfigureRemoteDatastore("", "/remote_api",
		lambda : ("user@email.com", "password"),
		servername="%s:%s"%(config.web.host, config.web.port))

def init_ndb(datastore_file="/dev/null"):
	import os
	from google.appengine.api import apiproxy_stub_map, datastore_file_stub
	app_id = read("app.yaml", True)[0].split(": ")[1].strip()
	os.environ['APPLICATION_ID'] = app_id
	apiproxy_stub_map.apiproxy = apiproxy_stub_map.APIProxyStubMap() 
	stub = datastore_file_stub.DatastoreFileStub(app_id, datastore_file, '/')
	apiproxy_stub_map.apiproxy.RegisterStub('datastore_v3', stub)