import json, operator
from base64 import b64decode
from datetime import datetime
from sqlalchemy import func
from session import session

modelsubs = {}
operators = {
    "==": operator.__eq__,
    ">=": operator.__ge__,
    "<=": operator.__le__,
    "!=": operator.__ne__,
    ">": operator.__gt__,
    "<": operator.__lt__
}

def get_model(modelName):
    return modelsubs.get(modelName, None)

def get_schema(modname=None):
    if modname:
        if not isinstance(modname, basestring):
            modname = modname.__name__
        return modelsubs[modname.lower()]._schema
    s = {}
    for key, val in modelsubs.items():
        if key not in ["modelbase", "ctrefcount"]:
            s[key] = val._schema
    return s

def get_page(modelName, limit, offset, order='index', filters={}, session=session):
    from properties import KeyWrapper
    #SAWarning: Can't resolve label reference '-draw_num'; converting to text()
    #'-column_name' or 'column_name desc' work but give this warning
    schema = get_schema(modelName)
    mod = get_model(modelName)
    query = mod.query(session=session)
    for key, obj in filters.items():
        val = obj["value"]
        comp = obj["comparator"]
        prop = getattr(mod, key)
        if schema[key] == "key" and not isinstance(val, KeyWrapper):
            val = KeyWrapper(val)
        elif schema[key] == "datetimeautostamper" and not isinstance(val, datetime):
            val = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
        if comp == "like":
            query.filter(func.lower(prop).like(val.lower()))
        else:
            query.filter(operators[comp](prop, val))
    return [d.data() for d in query.order(order).fetch(limit, offset)]

def getall(entity=None, query=None, keys_only=False, session=session):
    if query:
        res = query.all()
    elif entity:
        res = entity.query(session=session).all()
    if keys_only: # TODO: query for keys. for now, do with query.
        return [r.key for r in res]
    return res

def get(b64compkey, session=session):
    if not isinstance(b64compkey, basestring):
        b64compkey = b64compkey.urlsafe()
    compkey = json.loads(b64decode(b64compkey))
    return modelsubs[compkey["model"]].query(session=session).query.get(compkey["index"])

def get_multi(b64keys, session=session):
    # b64keys can be Key instances or b64 key strings
    if b64keys and not isinstance(b64keys[0], basestring):
        b64keys = [k.urlsafe() for k in b64keys]
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
        for r in mod.query(session=session).filter(mod.index.in_(val["indices"])).all():
            res[r.id()] = r
    return [res[k] for k in b64keys]
