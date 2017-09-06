import json
from base64 import b64decode
from datetime import datetime
from sqlalchemy import func
from session import session
from ..shared import *

def _apply_filter(query, key, obj, modelName, joinz):
    from properties import KeyWrapper
    val = obj["value"]
    comp = obj["comparator"]
    if "." in key:
        altname, key = key.split(".")
        mod = get_model(altname)
        schema = get_schema(altname)
        if altname not in joinz:
            _join(modelName, altname, joinz, query)
    else:
        schema = get_schema(modelName)
        mod = get_model(modelName)
    prop = getattr(mod, key)
    ptype = schema[key]
    if ptype == "key" and not isinstance(val, KeyWrapper):
        val = KeyWrapper(val)
    elif ptype == "datetime" and not isinstance(val, datetime):
        val = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
    if comp == "like":
        query.filter(func.lower(prop).like(val.lower()))
    elif comp == "contains":
        query.filter(prop.contains(val))
    elif comp == "lacks":
        query.filter(~prop.contains(val))
    else:
        query.filter(operators[comp](prop, val))

def _join(modelName, altname, joinz, query):
    joinz.add(altname)
    altschema = get_schema(altname)
    if modelName in altschema["_kinds"]:
        mod1 = get_model(modelName)
        mod2 = get_model(altname)
        kinds = altschema["_kinds"][modelName]
    else:
        mod1 = get_model(altname)
        mod2 = get_model(modelName)
        kinds = get_schema(modelName)["_kinds"][altname]
    for kind in kinds:
        if hasattr(mod2, kind):
            mod2attr = getattr(mod2, kind)
            break
    query.join(get_model(altname), mod1.key == mod2attr)

def get_page(modelName, limit, offset, order='index', filters={}, session=session):
    query = get_model(modelName).query(session=session)
    joinz = set()
    for key, obj in filters.items():
        _apply_filter(query, key, obj, modelName, joinz)
    if "." in order:
        mod, attr = order.split(".")[-2:]
        if joinz or not get_model(attr): # skip refcount shortcut if filtering on joined table
            desc = False
            if mod.startswith("-"):
                desc = True
                mod = mod[1:]
            order = getattr(get_model(mod), attr)
            if desc:
                order = -order
            mod not in joinz and _join(modelName, mod, joinz, query)
    return [d.export() for d in query.order(order).fetch(limit, offset)]

def getall(entity=None, query=None, keys_only=False, session=session):
    if query:
        res = query.all()
    elif entity:
        res = entity.query(session=session).all()
    if keys_only: # TODO: query for keys. for now, do with query.
        return [r.key for r in res]
    return res

def b64d(compkey):
    from cantools.db import pad_key
    return b64decode(pad_key(compkey))

def key2data(b64compkey):
    if not isinstance(b64compkey, basestring):
        b64compkey = b64compkey.urlsafe()
    return json.loads(b64d(b64compkey))

def get(b64compkey, session=session):
    try:
        compkey = key2data(b64compkey)
    except:
        from cantools.util import error
        error("bad key: %s"%(b64compkey,))
    return modelsubs[compkey["model"]].query(session=session).query.get(compkey["index"])

def get_multi(b64keys, session=session):
    # b64keys can be Key instances or b64 key strings
    if b64keys and not isinstance(b64keys[0], basestring):
        b64keys = [k.urlsafe() for k in b64keys]
    keys = [json.loads(b64d(k)) for k in b64keys]
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
