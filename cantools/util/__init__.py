from io import read, write, writejson
from reporting import set_log, close_log, log, set_error, error, start_timer, end_timer
from system import cp, sym, mkdir, rm, cmd, output
from data import getxls, gettsv, getcsv, getcsv_from_data, flatten, arr2csv, batch, token
from media import transcode, segment, hlsify, crop

def init_gae():
    try:
        from google import appengine
    except: # running outside of dev_appserver
        import os, sys
        gae_p = None
        for p in os.environ["PATH"].split(":"):
            if p.endswith("google_appengine"):
                gae_p = p
                break
        if not gae_p:
            from cantools import config
            gae_p = config.cache("\n".join([
                "can't find google - please enter the path to google_appengine",
                " - if you DON'T have a copy, get one here:",
                "   https://cloud.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python",
                " - if you DO have a copy, enter the path to it below",
                "so what's the path? "]), password=False)
            if not gae_p:
                error("can't find google_appengine in path! please add and retry.")
        sys.path.append(gae_p)
        if 'google' in sys.modules:
            del sys.modules['google']
        import dev_appserver
        dev_appserver.fix_sys_path()
        sys.path.insert(0, ".")

# accesses ct gae app running locally or elsewhere (other than app engine production, aka gcloud)
def init_ndb():
    from cantools import config
    from google.appengine.ext.remote_api import remote_api_stub
    remote_api_stub.ConfigureRemoteDatastore("", "/remote_api",
        lambda : ("user@email.com", "password"),
        servername="%s:%s"%(config.web.host, config.web.port))

# these are essentially not recommended. google's
# rules for operating outside of their native environment
# are crappy and generally get worse with time. these
# _sort of_ work, but easily get messed up. it's whatever.
def init_ndb_cloud(url=None):
    from cantools import config
    from google.appengine.ext.remote_api import remote_api_stub
    if not url:
        app_id = read("app.yaml", True)[0].split(": ")[1].strip()
        url = "%s.appspot.com"%(app_id,)
    remote_api_stub.ConfigureRemoteApiForOAuth(url, "/_ah/remote_api")

def init_ndb_depped(datastore_file="/dev/null"):
    import os
    from google.appengine.api import apiproxy_stub_map, datastore_file_stub
    app_id = read("app.yaml", True)[0].split(": ")[1].strip()
    os.environ['APPLICATION_ID'] = app_id
    apiproxy_stub_map.apiproxy = apiproxy_stub_map.APIProxyStubMap() 
    stub = datastore_file_stub.DatastoreFileStub(app_id, datastore_file, '/')
    apiproxy_stub_map.apiproxy.RegisterStub('datastore_v3', stub)