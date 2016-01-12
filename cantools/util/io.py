import json, pprint

def read(fname="_tmp", lines=False, isjson=False, default=None):
    try:
        f = open(fname, "r")
    except Exception, e:
        if default is not None:
            return default
        if lines:
            return []
        return None
    if lines:
        text = f.readlines()
    else:
        text = f.read()
    f.close()
    return isjson and json.loads(text) or text

def write(data, fname="_tmp", isjson=False, ispretty=False):
    f = open(fname, "w")
    f.write(isjson and (ispretty and pprint.pformat(data) or json.dumps(data)) or data)
    f.close()

def writejson(data, fname): # fname doesn't include .json extension
    write(data, "%s.json"%(fname,), True)
    write(data, "%s-pretty.json"%(fname,), True, True)