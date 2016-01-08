from google.appengine.ext import ndb

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

# entity keys
Key = ndb.Key

# funcs
get_multi = ndb.get_multi
put_multi = ndb.put_multi
delete_multi = ndb.delete_multi