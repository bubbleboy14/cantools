def read(fname="_tmp", lines=False):
    try:
        f = open(fname, "r")
    except Exception, e:
        if lines:
            return []
        return None
    if lines:
        text = f.readlines()
    else:
        text = f.read()
    f.close()
    return text

def write(text, fname="_tmp"):
    f = open(fname, "w")
    f.write(text)
    f.close()