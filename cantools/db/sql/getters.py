import json
from base64 import b64encode, b64decode

modelsubs = {}

def getall(entity=None, query=None, keys_only=False):
    if query:
        res = query.all()
    elif entity:
        res = entity.query().all()
    if keys_only:
        return [r.id() for r in res]
    return res

def get(b64compkey):
    compkey = json.loads(b64decode(b64compkey))
    return modelsubs[compkey["model"]].query().get(compkey["index"])

def get_multi(b64keys):
    keys = [json.loads(b64decode(k)) for k in b64keys]
    ents = {}
    res = {}
    for k in keys:
        mod = k["model"]
        if mod not in ents:
            ents[mod] = {
                "model": modelsubs[mod],
                "indices": []
            }
        ents[mod]["indices"].append(k["index"])
    for key, val in ents.items():
        mod = val["model"]
        for r in mod.query().filter(mod.index.in_(val["indices"])).all():
            res[r.id()] = r
    return [res[k] for k in b64keys]