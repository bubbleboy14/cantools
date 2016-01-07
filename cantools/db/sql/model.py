from base64 import b64encode, b64decode
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from properties import *
from query import *
from cantools import util

def choice_validator(choices):
    def cval(s, k, v):
        if v not in choices:
            util.error("can't set %s! %s not in %s"%(k, v, choices))
        return v
    return cval

def loadTables(cls): # ensure tables exist
    cls.metadata.create_all(engine)

class CTMeta(DeclarativeMeta):
    def query(cls, *args, **kwargs):
        loadTables(cls)
        return Query(cls, *args, **kwargs)

    def __new__(cls, name, bases, attrs):
        lname = name.lower()
        attrs["__tablename__"] = lname
        if lname != "modelbase":
            attrs["__mapper_args__"] = {
                "polymorphic_identity": lname
            }
            attrs["index"] = ForeignKey(bases[0], primary_key=True)
        for key, val in attrs.items():
            if getattr(val, "choices", None):
                attrs["%s_validator"%(key,)] = sqlalchemy.orm.validates(key)(choice_validator(val.choices))
        modelsubs[lname] = super(CTMeta, cls).__new__(cls, name, bases, attrs)
        return modelsubs[lname]

class ModelBase(declarative_base()):
    index = Integer(primary_key=True)
    polytype = String()
    key = CompositeKey()
    __metaclass__ = CTMeta
    __mapper_args__ = {
        "polymorphic_on": polytype,
        "polymorphic_identity": "modelbase",
        "with_polymorphic": "*"
    }

    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def put(self):
        for key, val in self.__class__.__dict__.items():
            if getattr(val, "is_dt_autostamper", False) and val.should_stamp(not self.index):
                setattr(self, key, datetime.now())
        loadTables(self.__class__)
        session.add(self)
        if not self.key:
            self.key = b64encode(json.dumps({
                "index": self.index,
                "model": self.polytype
            }))

    def rm(self):
        session.delete(self)

    def collection(self, entity_model, property_name, fetch=True, keys_only=False, data=False):
        q = entity_model.query(getattr(entity_model, property_name) == self.index)
        if not fetch:
            return q
        if not data:
            return q.fetch(1000, keys_only=keys_only)
        return [d.data() for d in q.fetch(1000)]

    def modeltype(self):
        return self.__tablename__

    def id(self):
        if not self.key:
            util.error("can't get id -- not saved!")
        return self.key.urlsafe()