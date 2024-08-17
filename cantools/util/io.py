import json, pprint
from fyg.util import selnum, confirm

def read(fname="_tmp", lines=False, isjson=False, default=None, binary=False):
    try:
        f = open(fname, binary and "rb" or "r")
    except Exception as e:
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
    if isjson:
        try:
            return json.loads(text)
        except json.decoder.JSONDecodeError:
            if len(text) > 500:
                excerpt = text[:100] + " ... " + text[-100:]
            else:
                excerpt = text
            print("io.read(%s) failed to JSON decode: %s"%(fname, excerpt))
            return default
    return text

def write(data, fname="_tmp", isjson=False, ispretty=False, binary=False, append=False, newline=False):
    f = open(fname, append and "a" or binary and "wb" or "w")
    f.write(isjson and (ispretty and pprint.pformat(data) or json.dumps(data)) or data)
    if newline:
        f.write("\n")
    f.close()

def writejson(data, fname): # fname doesn't include .json extension
    write(data, "%s.json"%(fname,), True)
    write(data, "%s-pretty.json"%(fname,), True, True)