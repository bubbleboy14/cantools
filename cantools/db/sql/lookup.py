from model import session, get_model, put_multi, ForeignKey, String, Integer, ModelBase

class CTRefCount(ModelBase):
    target = ForeignKey()      # instance pointed at
    reference = String()       # table.property (such as 'building.owner')
    count = Integer(default=0) # number of pointers

    def put(self, session=session): # overrides
        put_multi([self], session)

    def inc(self, amount=1):
        self.count += amount

    def dec(self, amount=1):
        self.count -= amount

    def refresh(self):
        fname, fkey = self.reference.split(".")
        fmod = get_model(fname)
        self.count = fmod.query(getattr(fmod, fkey) == self.target).count()

def ref_counter(target, reference, session=session):
    return CTRefCount.query(CTRefCount.target == target,
        CTRefCount.reference == reference, session=session
    ).get() or CTRefCount(target=target, reference=reference)

def inc_counter(target, reference, amount=1, session=session):
    rc = ref_counter(target, reference, session)
    rc.inc(amount)
    return rc

def dec_counter(target, reference, amount=1, session=session):
    rc = ref_counter(target, reference, session)
    rc.dec(amount)
    return rc

def refresh_counter(target, reference, skip_existing=False, session=session):
    rc = ref_counter(target, reference, session)
    if not (skip_existing and rc.key):
        rc.refresh()
        return rc