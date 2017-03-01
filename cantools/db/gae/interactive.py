import os, getpass
from cantools import config

def init():
    import dev_appserver
    dev_appserver.fix_sys_path()
    from google.appengine.ext.remote_api import remote_api_stub

    def auth_func():
        return (raw_input('Username: '), getpass.getpass('Password: '))

    def noauth():
        return ("user@email.com", "password")

    APP_ID = os.environ['APPLICATION_ID'] = config.cache("application id? ",
        password=False)
    if raw_input("remote? [no]") == "yes":
        remote_api_stub.ConfigureRemoteDatastore(APP_ID, '/remote_api', auth_func)
    else:
        remote_api_stub.ConfigureRemoteDatastore("", '/remote_api', noauth,
            servername="%s:%s"%(config.web.host, config.web.port))
