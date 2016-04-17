import base64, json
from datetime import datetime
from properties import KeyWrapper
from session import session
from cantools.util import batch

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
        instance.key = instance.key or KeyWrapper(base64.b64encode(json.dumps({
            "index": instance.index,
            "model": instance.polytype
        })))

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
                    val = KeyWrapper(val)
                elif ent._schema[propname] == "datetimeautostamper" and not isinstance(val, datetime):
                    val = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
            setattr(ent, propname, val)
    ent.put()
    return ent