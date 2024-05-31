from sqlalchemy import orm
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from .query import *
from cantools.util import log, error
from six import with_metaclass

def choice_validator(choices):
    def cval(s, k, v):
        if v not in choices:
            error("can't set %s! %s not in %s"%(k, v, choices))
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
            for key, val in list(attrs.items()):
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

class ModelBase(with_metaclass(CTMeta, sa_dbase)):
    index = Integer(primary_key=True)
    polytype = String()
    key = CompositeKey()
    __mapper_args__ = {
        "polymorphic_on": polytype,
        "polymorphic_identity": "modelbase",
        "with_polymorphic": "*"
    }
    label = "key"
    _data_omit = []
    _unique_cols = []

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

    def handle_error(self, e, session=None, flag=" no such column: "):
        log("Database operation failed: %s"%(e,), important=True)
        session = session or seshman.get()
        raise_anyway = True
        stre = str(e)
        if flag in stre:
            target = stre.split(flag)[1].split(None, 1)[0]
            log("Missing column: %s"%(target,), important=True)
            if config.db.alter:
                if "." in target:
                    tmod, tcol = target.split(".")
                else:
                    tcol = target
                    tmod = self.polytype
                if config.db.alter == "auto" or not input("Add missing column '%s' to table '%s' (sqlite-only!)? [Y/n] "%(tcol, tmod)).lower().startswith("n"):
                    raise_anyway = False
                    log("adding '%s' to '%s'"%(tcol, tmod))
                    with session.engine.connect() as conn:
                        result = conn.execute(text("ALTER TABLE %s ADD COLUMN %s"%(tmod, tcol)))
            else:
                log("To auto-update columns, add 'DB_ALTER = True' to your ct.cfg (sqlite only!)", important=True)
        if raise_anyway:
            error(e)

    def _defaults(self):
        for prop in self._schema["_kinds"]:
            if getattr(self, prop, None) is None:
                if self._schema[prop].endswith("list"):
                    val = []
                else:
                    val = KeyWrapper()
                setattr(self, prop, val)
        self.key = KeyWrapper()
        for key, val in list(self.__class__.__dict__.items()):
            if getattr(self, key, None) is None and getattr(val, "_default", None) is not None:
                setattr(self, key, val._default)

    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return self.key.__hash__()

    def put(self, session=None):
        try:
            put_multi([self], session)
        except Exception as e:
            self.handle_error(e, session, "has no column named")

    def otherwith(self, prop, val):
        k = self._schema[prop]
        c = self.__class__
        col = getattr(c, prop)
        q = c.query(c.key != self.key)
        print("checking", c.__name__, "for", prop, k, "=", val)
        if k.endswith("list"):
            for v in val:
                q.filter(col.contains(v))
        else:
            q.filter(col == val)
        return q.get()

    def beforeedit(self, edits):
        for prop in edits:
            if prop in self._unique_cols and self.otherwith(prop, edits[prop]):
                print(prop, "conflict!\n\n")
                return "%s must be unique"%(prop,)

    def beforeremove(self, session):
        pass

    def afterremove(self, session):
        pass

    def rm(self, commit=True, session=None):
        session = session or seshman.get()
        self.beforeremove(session)
        session.delete(self)
        commit and session.commit()
        self.afterremove(session)

    def collection(self, entity_model, property_name=None, fetch=True, keys_only=False, data=False):
        if isinstance(entity_model, str):
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
        for key, prop in list(self._schema.items()):
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

    def labeler(self):
        if self.label == "key":
            return self.id()
        return getattr(self, self.label) or "%s %s"%(self.polytype, self.index)

    def _basic(self, d):
        d["key"] = self.id()
        d["index"] = self.index
        d["modelName"] = self.polytype
        d["_label"] = self.label
        d["label"] = self.labeler()
        return d

    def data(self):
        return self._basic(self.mydata())

    def export(self):
        return self._basic(ModelBase.mydata(self, True))

class TimeStampedBase(ModelBase):
    created = DateTime(auto_now_add=True)
    modified = DateTime(auto_now=True)