from cantools.util import batch, log
from edit import *
from ..shared import ct_key

def _init_entity(instance, session=session, preserve_timestamps=False):
    from lookup import inc_counter, dec_counter
    puts = []
    now = datetime.now()
    cls = instance.__class__
    tname = instance.__tablename__
    if tname != "ctrefcount":
        if hasattr(instance, "_pre_put"):
            instance._pre_put()
        for key, val in cls.__dict__.items():
            if not preserve_timestamps and getattr(val, "is_dt_autostamper", False) and val.should_stamp(not instance.index):
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

def init_multi(instances, session=session, preserve_timestamps=False):
    if preserve_timestamps:
        log("initializing %s instances -- preserving timestamps!"%(len(instances),))
    lookups = []
    with session.no_autoflush:
        for instance in instances:
            lookups += _init_entity(instance, session, preserve_timestamps)
    session.add_all(instances + lookups)
    session.flush()
    for instance in instances:
        instance.key = instance.key or KeyWrapper(ct_key(instance.polytype, instance.index))

def put_multi(instances, session=session, preserve_timestamps=False):
    session.init()
    batch(instances, init_multi, session, preserve_timestamps)
    session.commit()

def delete_multi(instances, session=session):
    for instance in instances:
        instance.rm(False)
    session.commit()