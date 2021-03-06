from datetime import datetime
from .properties import KeyWrapper
from .session import session

def _trans_key(val):
    return KeyWrapper(val)

def _trans_keylist(val):
    return [KeyWrapper(v) for v in val]

def _trans_datetime(val):
    return isinstance(val, datetime) and val or datetime.strptime(val, "%Y-%m-%d %H:%M:%S")

ETRANS = {
    "key": _trans_key,
    "keylist": _trans_keylist,
    "datetime": _trans_datetime
}
def add_edit_transformation(ptype, func):
    ETRANS[ptype] = func

def edit(data, session=session):
    from cantools.db import get, get_model
    haskey = "key" in data
    ent = haskey and get(data["key"], session) or get_model(data["modelName"])()
    haskey and ent.beforeedit(data)
    for propname, val in list(data.items()):
        if propname in ent._schema:
            if val:
                proptype = ent._schema[propname]
                if hasattr(ent, "_pre_trans_%s"%(propname,)):
                    val = getattr(ent, "_pre_trans_%s"%(propname,))(val)
                if proptype in ETRANS:
                    val = ETRANS[proptype](val)
                if hasattr(ent, "_trans_%s"%(propname,)):
                    val = getattr(ent, "_trans_%s"%(propname,))(val)
            setattr(ent, propname, val)
    if not haskey and hasattr(ent, "oncreate"):
        ent.oncreate()
    ent.put()
    return ent