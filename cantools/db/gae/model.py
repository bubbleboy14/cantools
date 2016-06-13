from datetime import datetime
from properties import *

class CTMeta(ndb.MetaModel):
    def __new__(cls, name, bases, attrs):
        lname = name.lower()
        if lname != "modelbase":
            if "label" not in attrs:
                for label in ["name", "title"]:
                    if label in attrs:
                        attrs["label"] = label
                        break
                if "label" not in attrs:
                    attrs["label"] = "key"
            schema = attrs["_schema"] = merge_schemas(bases, attrs["label"])
            for key, val in attrs.items():
                if getattr(val, "_ct_type", None):
                    schema[key] = val._ct_type
                    if val._ct_type == "key":
                        schema["_kinds"][key] = getattr(val, "_kinds", "*") # always * for now...
        modelsubs[lname] = super(CTMeta, cls).__new__(cls, name, bases, attrs)
        return modelsubs[lname]

class ModelBase(ndb.Model):
    __metaclass__ = CTMeta
    index = Integer()

    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return 0 # ensures proper set-uniquification

    def put(self):
        if not self.index:
            self.index = self.__class__.query().count() + 1
        super(ModelBase, self).put()

    def rm(self):
        self.key.delete()

    def collection(self, entity_model, property_name, fetch=True, keys_only=False, data=False):
        q = entity_model.query(ndb.GenericProperty(property_name) == self.key)
        if not fetch:
            return q
        if not data:
            return q.fetch(1000, keys_only=keys_only)
        return [d.data() for d in q.fetch(1000)]

    def modeltype(self):
        return self.__class__.__name__.lower()

    def id(self):
        return self.key.urlsafe()

    def export(self):
        cols = {}
        mt = self.modeltype()
        cols["key"] = self.id()
        cols["ctkey"] = ct_key(mt, self.index)
        cols["oldkey"] = str(self.key.to_old_key())
        cols["index"] = self.index
        cols["modelName"] = mt
        cols["_label"] = self.label
        for cname, prop in self._schema.items():
            if not cname.startswith("_"):
                val = getattr(self, cname)
                if prop.startswith("key"):
                    if type(val) is list:
                        val = [v.urlsafe() for v in val]
                    elif hasattr(val, "urlsafe"):
                        val = val.urlsafe()
                elif prop == "blob":
                    val = bool(val)
                elif val and prop == "datetime":
                    val = str(val)[:19]
                cols[cname] = val
        cols["label"] = cols[self.label] or "%s %s"%(mt, self.index)
        return cols

def getall(entity=None, query=None, keys_only=False):
    cursor = None
    ents = []
    while True:
        q = query or entity.query()
        batch, cursor, more = q.fetch_page(1000, start_cursor=cursor, keys_only=keys_only)
        ents += batch
        if len(batch) < 1000:
            break
    return ents

def get(key):
    return Key(urlsafe=key).get()

def get_page(modelName, limit, offset, order='index', filters={}):
    schema = get_schema(modelName)
    mod = get_model(modelName)
    query = mod.query()
    for key, obj in filters.items():
        val = obj["value"]
        comp = obj["comparator"]
        prop = getattr(mod, key)
        if schema[key] == "key" and not isinstance(val, KeyWrapper):
            val = KeyWrapper(val)
        elif schema[key] == "datetime" and not isinstance(val, datetime):
            val = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
        if comp == "like":
            query.filter(func.lower(prop).like(val.lower()))
        else:
            query.filter(operators[comp](prop, val))
    return [d.export() for d in query.order(order).fetch(limit, offset=offset)]

def edit(data):
    ent = "key" in data and get(data["key"]) or get_model(data["modelName"])()
    for propname, val in data.items():
        if propname in ent._schema:
            if val:
                if propname in ent._schema["_kinds"]: # foreignkey
                    val = KeyWrapper(val)
                elif ent._schema[propname] == "datetime" and not isinstance(val, datetime):
                    val = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
            setattr(ent, propname, val)
    ent.put()
    return ent