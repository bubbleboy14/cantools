import json, pprint

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
        return json.loads(text)
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

def selnum(data, rower=pprint.pformat):
    if not data:
        return print("nothing to select - you select nothing")
    ld = len(data)
    lines = ["#%s :: %s"%(i + 1, rower(data[i])) for i in range(ld)]
    print("you have %s options:\n"%(ld,), *lines, sep="\n")
    while True:
        whatdo = input("\nplease enter a number from 1 to %s: "%(ld,))
        try:
            whatdo = int(whatdo)
        except:
            print("'%s' is not a usable answer - try again!"%(whatdo,))
        else:
            if whatdo > 0 and whatdo <= ld:
                whatdo -= 1
                print("\n\nyou've selected: %s"%(lines[whatdo],))
                return data[whatdo]
            print("'%s' is out of range - try again!"%(whatdo,))