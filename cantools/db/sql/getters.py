import json
from base64 import b64encode, b64decode

modelsubs = {}

def get_model(modelName):
    return modelsubs.get(modelName, None)

def get_schema():
    s = {}
    for key, val in modelsubs.items():
        if key != "modelbase":
            s[key] = val._schema
    return s

def getall(entity=None, query=None, keys_only=False, session=None):
    if query:
        res = query.all()
    elif entity:
        res = entity.query(session).all()
    if keys_only:
        return [r.key for r in res]
    return res

def get(b64compkey, session=None):
    compkey = json.loads(b64decode(b64compkey))
    return modelsubs[compkey["model"]].query(session).query.get(compkey["index"])

def get_multi(keyobjs, session=None):
    b64keys = [k.urlsafe() for k in keyobjs]
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
        for r in mod.query(session).filter(mod.index.in_(val["indices"])).all():
            res[r.id()] = r
    return [res[k] for k in b64keys]