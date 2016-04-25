from sqlalchemy import orm
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from query import *
from cantools import util

def choice_validator(choices):
    def cval(s, k, v):
        if v not in choices:
            util.error("can't set %s! %s not in %s"%(k, v, choices))
        return v
    return cval

class CTMeta(DeclarativeMeta):
    def query(cls, *args, **kwargs):
        return Query(cls, *args, **kwargs)

    def __new__(cls, name, bases, attrs):
        lname = name.lower()
        attrs["__tablename__"] = lname
        if lname != "modelbase":
            attrs["__mapper_args__"] = {
                "polymorphic_identity": lname
            }
            attrs["index"] = sqlForeignKey(bases[0], primary_key=True)
            if "label" not in attrs:
                for label in ["name", "title"]:
                    if label in attrs:
                        attrs["label"] = label
                        break
                if "label" not in attrs:
                    attrs["label"] = "key"
            schema = attrs["_schema"] = { "_kinds": {}, "_label": attrs["label"] }
            for key, val in attrs.items():
                if getattr(val, "_ct_type", None):
                    schema[key] = val._ct_type
                    if val._ct_type == "key":
                        schema["_kinds"][key] = val._kinds
                if getattr(val, "choices", None):
                    attrs["%s_validator"%(key,)] = sqlalchemy.orm.validates(key)(choice_validator(val.choices))
        modelsubs[lname] = super(CTMeta, cls).__new__(cls, name, bases, attrs)
        return modelsubs[lname]

sa_dbase = declarative_base(metadata=metadata)

class ModelBase(sa_dbase):
    index = Integer(primary_key=True)
    polytype = String()
    key = CompositeKey()
    __metaclass__ = CTMeta
    __mapper_args__ = {
        "polymorphic_on": polytype,
        "polymorphic_identity": "modelbase",
        "with_polymorphic": "*"
    }

    def __init__(self, *args, **kwargs):
        sa_dbase.__init__(self, *args, **kwargs)
        self._defaults()
        self._init()

    @orm.reconstructor
    def _init(self):
        self._name = "%s(%s)"%(self.polytype, getattr(self, self.label))
        self._orig_fkeys = {}
        for prop in self._schema["_kinds"]:
            self._orig_fkeys[prop] = getattr(self, prop)

    def _defaults(self):
        for prop in self._schema["_kinds"]:
            if getattr(self, prop, None) is None:
                setattr(self, prop, KeyWrapper())
        self.key = KeyWrapper()
        for key, val in self.__class__.__dict__.items():
            if getattr(self, key, None) is None and getattr(val, "_default", None) is not None:
                setattr(self, key, val._default)

    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def put(self, session=session):
        put_multi([self], session)

    def rm(self, commit=True, session=session):
        session.delete(self)
        if commit:
            session.commit()

    def collection(self, entity_model, property_name, fetch=True, keys_only=False, data=False):
        q = entity_model.query(getattr(entity_model, property_name) == self.key)
        if not fetch:
            return q
        if not data:
            return q.fetch(1000, keys_only=keys_only)
        return [d.data() for d in q.fetch(1000)]

    def modeltype(self):
        return self.__tablename__

    def id(self):
        return self.key.urlsafe()

    def mydata(self):
        return {}

    def data(self):
        d = self.mydata()
        d["key"] = self.id()
        d["label"] = self.label
        d["modelName"] = self.polytype
        return d