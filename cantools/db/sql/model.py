from sqlalchemy.ext.declarative import declarative_base
from properties import *
from query import *

class CTMeta(type):
    def __new__(cls, name, bases, attrs):
        attrs["__tablename__"] = name.lower() + "s"
        return type(name, bases, attrs)

    def query(cls, *args, **kwargs):
        return Query(cls, *args, **kwargs)

class ModelBase(declarative_base()):
    __metaclass__ = CTMeta
    key = String(primary_key=True)

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