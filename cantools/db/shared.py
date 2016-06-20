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

def dprep(obj, schema=None): # prepares data object for model
    schema = schema or get_schema(obj["modelName"])
    o = {}
    for key, prop in schema.items():
        if key in obj:
            if prop == "datetime" and obj[key]:
                o[key] = datetime.strptime(obj[key].replace("T", " ").replace("Z", ""), "%Y-%m-%d %X")
            elif prop == "string" and isinstance(obj[key], unicode):
                o[key] = obj[key].encode("utf-8")
            elif key != "_label":
                o[key] = obj[key]
    return o

def ct_key(modelName, index):
    return base64.b64encode(json.dumps({
        "index": index,
        "model": modelName
    }))

def merge_schemas(bases, label):
    kinds = {}
    schema = { "index": "immutable", "key": "key_immutable" }
    for base in bases:
        if hasattr(base, "_schema"):
            schema.update(base._schema)
            kinds.update(base._schema["_kinds"])
    schema["_kinds"] = kinds
    schema["_label"] = label
    return schema