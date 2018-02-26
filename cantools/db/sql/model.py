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
                for label in ["name", "title", "topic"]:
                    if label in attrs:
                        attrs["label"] = label
                        break
            schema = attrs["_schema"] = merge_schemas(bases, attrs.get("label"))
            for key, val in attrs.items():
                if getattr(val, "_ct_type", None):
                    schema[key] = val._ct_type
                    if val._ct_type.startswith("key"):
                        schema["_kinds"][key] = val._kinds
                if getattr(val, "choices", None):
                    attrs["%s_validator"%(key,)] = sqlalchemy.orm.validates(key)(choice_validator(val.choices))
        modelsubs[lname] = super(CTMeta, cls).__new__(cls, name, bases, attrs)
        modelsubs[lname].__name__ = lname
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
    label = "key"
    _data_omit = []

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
                if self._schema[prop].endswith("list"):
                    val = []
                else:
                    val = KeyWrapper()
                setattr(self, prop, val)
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

    def collection(self, entity_model, property_name=None, fetch=True, keys_only=False, data=False):
        if isinstance(entity_model, basestring):
            entity_model = get_model(entity_model)
        q = entity_model.query(getattr(entity_model, property_name or self.polytype) == self.key)
        if not fetch:
            return q
        if not data:
            return q.fetch(1000, keys_only=keys_only)
        return [d.data() for d in q.fetch(1000)]

    def modeltype(self):
        return self.__tablename__

    def id(self):
        return self.key.urlsafe()

    def _has_complete_key(self):
        return bool(self.id())

    def mydata(self, isexport=False):
        cols = {}
        for key, prop in self._schema.items():
            if not isexport and key in self._data_omit:
                continue
            if not key.startswith("_"):
                val = getattr(self, key)
                if prop.startswith("key"):
                    if type(val) is list:
                        val = [v.urlsafe() for v in val]
                    elif hasattr(val, "urlsafe"):
                        val = val.urlsafe()
                elif prop == "blob" and hasattr(val, "urlsafe"):
                    val = val.urlsafe()
                elif val and prop == "datetime":
                    val = str(val)[:19]
                elif prop in ["string", "text"]:
                    val = val or ""
                cols[key] = val
        return cols

    def _basic(self, d):
        d["key"] = self.id()
        d["index"] = self.index
        d["modelName"] = self.polytype
        d["_label"] = self.label
        d["label"] = d[self.label] or "%s %s"%(self.polytype, self.index)
        return d

    def data(self):
        return self._basic(self.mydata())

    def export(self):
        return self._basic(ModelBase.mydata(self, True))

class TimeStampedBase(ModelBase):
    created = DateTime(auto_now_add=True)
    modified = DateTime(auto_now=True)