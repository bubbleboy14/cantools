"""
ctmodel.py
version 0.1.11
MIT License:

Copyright (c) 2011 Civil Action Network

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

from google.appengine.ext import db

class ModelBase(db.Model):
    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return 0 # ensures proper set-uniquification

    def modeltype(self):
        return self.__class__.__name__.lower()

    def id(self):
        return str(self.key())

class Category(ModelBase):
    name = db.StringProperty()

    def data(self):
        return { "key": self.id(), "name": self.name }

def getcategories():
    return [c.data() for c in Category.all().fetch(1000)]

def getcategory(catname):
    cat = Category.all().filter("name = ", catname).get()
    if not cat:
        from util import fail
        fail("no such category: %s"%(catname,))
    return cat

class CategoriedModelBase(ModelBase):
    category = db.ListProperty(str) # cat ids
    date = db.DateTimeProperty(auto_now=True)

    def addcategory(self, category):
        cid = category.id()
        if cid not in self.category:
            self.category.append(cid)

    def removecategory(self, category):
        cid = category.id()
        if cid in self.category:
            self.category.remove(cid)

    def data(self):
        datadict = { "key": self.id(), "category": self.category }
        c = self.__class__
        while c != CategoriedModelBase:
            hasattr(c, 'mydata') and datadict.update(c.mydata(self))
            c = c.__base__
        return datadict

