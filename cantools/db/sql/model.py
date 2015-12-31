from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from properties import *
from query import *

class CTMeta(DeclarativeMeta):
    def __new__(cls, name, bases, attrs):
        lname = name.lower()
        attrs["__tablename__"] = lname
        if lname != "modelbase":
            attrs["__mapper_args__"] = {
                "polymorphic_identity": lname
            }
            attrs["key"] = ForeignKey(bases[0], primary_key=True)
#        print
#        print cls, name, bases, attrs
#        print
        return super(CTMeta, cls).__new__(cls, name, bases, attrs)

class ModelBase(declarative_base()):
    key = Integer(primary_key=True)
    polytype = String()
    __metaclass__ = CTMeta
    __mapper_args__ = {
        "polymorphic_on": polytype,
        "polymorphic_identity": "modelbase",
        "with_polymorphic": "*"
    }

    def __eq__(self, other):
        return self.key == (other and hasattr(other, "key") and other.key)

    def __ne__(self, other):
        return not self.__eq__(other)

    def put(self):
        session.add(self)

    def rm(self):
        session.delete(self)

    def collection(self, entity_model, property_name, fetch=True, keys_only=False, data=False):
        pass

    def modeltype(self):
        return self.__class__.__name__.lower()

    def id(self):
        return self.key

ModelBase.query = lambda *args, **kwargs : Query(*args, **kwargs)