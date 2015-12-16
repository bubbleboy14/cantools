from google.appengine.ext import ndb

# map: Integer, Float, Boolean, String, Text, Binary, Date, Time, DateTime, ForeignKey

# figure out: repeated, required, default, choices

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