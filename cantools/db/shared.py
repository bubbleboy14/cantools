import operator, base64, json
from datetime import datetime

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

def dprep(obj): # prepares data object for model
    schema = get_schema(obj["modelName"])
    for prop in schema:
        if schema[prop] == "datetime" and obj[prop]:
            obj[prop] = datetime.strptime(obj[prop], "%Y-%m-%d %X")
        elif schema[prop] == "string" and isinstance(obj[prop], unicode):
            obj[prop] = obj[prop].encode("utf-8")
    for key in ["modelName", "label", "_label", "ctkey", "oldkey"]:
        if key in obj:
            del obj[key]
    return obj

def ct_key(modelName, index):
    return base64.b64encode(json.dumps({
        "index": index,
        "model": modelName
    }))

def merge_schemas(bases, label):
    kinds = {}
    schema = {}
    for base in bases:
        if hasattr(base, "_schema"):
            schema.update(base._schema)
            kinds.update(base._schema["_kinds"])
    schema["_kinds"] = kinds
    schema["_label"] = label
    return schema