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
        loadTables(cls)
        return Query(cls, *args, **kwargs)

    def __new__(cls, name, bases, attrs):
        lname = name.lower()
        attrs["__tablename__"] = lname
        if lname != "modelbase":
            attrs["__mapper_args__"] = {
                "polymorphic_identity": lname
            }
            attrs["index"] = sqlForeignKey(bases[0], primary_key=True)
            schema = attrs["_schema"] = { "_kinds": {} }
            for key, val in attrs.items():
                if getattr(val, "_ct_type", None):
                    schema[key] = val._ct_type
                    if val._ct_type == "key":
                        schema["_kinds"][key] = val._kinds
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

    def put(self, session=session):
        put_multi([self], session)

    def rm(self, commit=True, session=session):
        session.delete(self)
        if commit:
            session.commit()

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

    def label(self):
        return getattr(self, "name", self.key)