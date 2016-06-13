from google.appengine.ext import ndb
from ..shared import *

# column properties
Integer = ndb.IntegerProperty
Float = ndb.FloatProperty
Boolean = ndb.BooleanProperty
String = ndb.StringProperty
Text = ndb.TextProperty
Binary = ndb.BlobProperty
Date = ndb.DateProperty
Time = ndb.TimeProperty
DateTime = ndb.DateTimeProperty
ForeignKey = ndb.KeyProperty

# ctypes
Integer._ct_type = "integer"
Float._ct_type = "float"
Boolean._ct_type = "boolean"
String._ct_type = "string"
Text._ct_type = "text"
Binary._ct_type = "blob"
Date._ct_type = "date"
Time._ct_type = "time"
DateTime._ct_type = "datetime"
ForeignKey._ct_type = "key"

# entity keys
Key = ndb.Key
KeyWrapper = ndb.Key

# funcs
get_multi = ndb.get_multi
put_multi = ndb.put_multi
delete_multi = ndb.delete_multi