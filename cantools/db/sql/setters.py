from datetime import datetime
from properties import KeyWrapper
from session import session
from cantools.util import batch
from ..shared import ct_key

def _init_entity(instance, session=session):
    from lookup import inc_counter, dec_counter
    puts = []
    now = datetime.now()
    cls = instance.__class__
    tname = instance.__tablename__
    if tname != "ctrefcount":
        for key, val in cls.__dict__.items():
            if getattr(val, "is_dt_autostamper", False) and val.should_stamp(not instance.index):
                setattr(instance, key, now)
            if key in instance._orig_fkeys:
                oval = instance._orig_fkeys[key]
                val = getattr(instance, key)
                if oval != val:
                    reference = "%s.%s"%(tname, key)
                    if type(oval) is list or type(val) is list:
                        for o in [o for o in (oval or []) if o not in val]:
                            puts.append(dec_counter(o, reference, session=session))
                        for v in [v for v in (val or []) if v not in oval]:
                            puts.append(inc_counter(v, reference, session=session))
                    else:
                        if oval:
                            puts.append(dec_counter(oval, reference, session=session))
                        if val:
                            puts.append(inc_counter(val, reference, session=session))
    return puts

def init_multi(instances, session=session):
    lookups = []
    with session.no_autoflush:
        for instance in instances:
            lookups += _init_entity(instance, session)
    session.add_all(instances + lookups)
    session.flush()
    for instance in instances:
        instance.key = instance.key or KeyWrapper(ct_key(instance.polytype, instance.index))

def put_multi(instances, session=session):
    session.init()
    batch(instances, init_multi, session)
    session.commit()

def delete_multi(instances, session=session):
    for instance in instances:
        instance.rm(False)
    session.commit()

def edit(data, session=session):
    from cantools.db import get, get_model
    ent = "key" in data and get(data["key"], session) or get_model(data["modelName"])()
    for propname, val in data.items():
        if propname in ent._schema:
            if val:
                if propname in ent._schema["_kinds"]: # foreignkey
                    if type(val) is list:
                        val = [KeyWrapper(v) for v in val]
                    else:
                        val = KeyWrapper(val)
                elif ent._schema[propname] == "datetime" and not isinstance(val, datetime):
                    val = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
            setattr(ent, propname, val)
    ent.put()
    return ent