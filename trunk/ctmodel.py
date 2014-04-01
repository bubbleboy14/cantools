"""
ctmodel.py
version 0.1.19
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

    def rm(self):
        self.delete()

    def modeltype(self):
        return self.__class__.__name__.lower()

    def modeltype_multiword(self):
        return self.modeltype()

    def modeltype_singular(self):
        return self.modeltype()

    def verb(self):
        return "participate in"

    def id(self):
        return str(self.key())

    def signature(self):
        return "%s(%s)"%(self.modeltype(), self.id())

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

class IP(ModelBase):
    address = db.StringProperty()
    userCount = db.IntegerProperty(default=0)
    voteCount = db.IntegerProperty(default=0)
    authCount = db.IntegerProperty(default=0)
    # collections: users, votes, auths

    def data(self):
        return {"key": self.id(),
                "address": self.address,
                "users": self.userCount,
                "votes": self.voteCount,
                "authentications": self.authCount}

class Log(ModelBase):
    message = db.TextProperty()
    type = db.StringProperty()
    ip = db.ReferenceProperty(IP, collection_name="logs")
    date = db.DateTimeProperty(auto_now_add=True)

class ZipCode(ModelBase):
    code = db.StringProperty()
    city = db.StringProperty()
    state = db.StringProperty()
    county = db.StringProperty()
    # collections: users, events

    def __str__(self):
        return self.code

    def fullString(self):
        return "%s, %s, %s"%(self.city, self.state, self.code)

    def data(self):
        return { "code": self.code, "city": self.city,
                 "state": self.state, "county": self.county }

class UserBase(ModelBase):
    firstName = db.StringProperty()
    lastName = db.StringProperty()
    email = db.StringProperty()
    password = db.StringProperty()
    zipcode = db.ReferenceProperty(ZipCode, collection_name="users")
    ip = db.ReferenceProperty(IP, collection_name="users")
    date = db.DateTimeProperty()

    def fullName(self):
        return self.firstName + (self.lastName and (" " + self.lastName) or "")

    def data(self):
        return { "key": self.id(), "firstName": self.firstName, "lastName": self.lastName }

    def comment(self, body, conversation):
        comment = Comment(user=self, conversation=conversation, body=body)
        if len(conversation.privlist):
            comment.seenlist = [self.id()]
        # we put conversation to update the date
        db.put([comment, conversation])

class AnonymousUser(UserBase):
    pass # only has firstName

class Conversation(ModelBase):
    topic = db.StringProperty()
    privlist = db.StringListProperty() # user ids ([] means public)
    date = db.DateTimeProperty(auto_now=True)
    # collections: comments

    def has_user(self, uid):
        return uid in self.privlist

    def add_user(self, user):
        if not self.has_user(user.id()):
            self.privlist.append(user.id())
            self.put()

    def title_analog(self):
        return self.topic

    def view_page(self):
        return "profile"

    def storylink(self, aslist=False):
        from util import flipQ, DOMAIN
        if aslist:
            return ["profile.html#", self.id()]
#            return "/profile.html#%s"%(flipQ(self.id()),)
        return "%s/profile.html#%s"%(DOMAIN, flipQ(self.id()))

    def data(self, nocomments=False, allcomments=False, unseencount=None, viewer=None):
        d = { "key": self.id(),
              "topic": self.topic }
        if not nocomments:
            q = self.comments.order("date")
            if not allcomments:
                q.filter("deleted = ", False)
            if unseencount:
                d['unseencount'] = self.comments.count() - q.filter("seenlist = ", unseencount).count()
                d['privlist'] = self.privlist
            else:
                comments = q.fetch(1000)
                if viewer:
                    puts = []
                    for c in comments:
                        if viewer not in c.seenlist:
                            c.seenlist.append(viewer)
                            puts.append(c)
                    if len(puts):
                        db.put(puts)
                d['comments'] = [c.data() for c in comments];
        return d

class Flaggable(db.Model):
    pass # collections: flags

class Comment(ModelBase, Flaggable):
    user = db.ReferenceProperty(UserBase, collection_name="comments")
    conversation = db.ReferenceProperty(Conversation, collection_name="comments")
    body = db.StringProperty(multiline=True) # searchable!
    date = db.DateTimeProperty(auto_now_add=True)
    deleted = db.BooleanProperty(default=False)
    seenlist = db.StringListProperty() # user ids ([] means public)
    # collections: flags

    def data(self, withseenlist=False):
        d = { "key": self.id(),
              "conversation": self.conversation.id(),
              "user": self.user.id(),
              "body": self.body,
              "deleted": self.deleted }
        if withseenlist:
            d['seenlist'] = self.seenlist
        return d

ZIPDOMAIN = None
def setzipdomain(zipdomain):
    global ZIPDOMAIN
    ZIPDOMAIN = zipdomain

def getip():
    import os
    addr = os.environ.get('REMOTE_ADDR', 'none')
    ip = IP.gql("WHERE address = :address", address=addr).get()
    if not ip:
        ip = IP()
        ip.address = addr
        ip.put()
    return ip

def hashpass(password, date):
    import hashlib
    return hashlib.md5(password + str(date.date()).replace('-','')).hexdigest()

def getzip(code):
    if len(code) < 5:
        from util import fail
        fail("invalid zip code")
    try:
        code = str(int(code.strip()[:5]))
        while len(code) < 5: # preceding 0's
            code = '0'+code
    except:
        from util import fail
        fail("invalid zip code")
    try:
        zipcode = ZipCode.all().filter("code =", code).fetch(1)[0]
    except:
        try:
            from google.appengine.api.urlfetch import fetch
            raw = fetch("http://%s/%s"%(ZIPDOMAIN, code))
        except Exception, e:
            from util import fail
            fail(repr(e))
        try:
            from util import json
            city, state, county = json.loads(raw.content)
        except Exception, e:
            from util import fail
            fail("%s || %s"%(repr(e), raw.content))
        try:
            zipcode = ZipCode(code=code, city=city, state=state, county=county)
            db.put(zipcode)
        except Exception, e:
            from util import fail
            fail(repr(e))
    return zipcode

def getzips(kwargs):
    zips = ZipCode.all()
    for key, val in kwargs.items():
        zips.filter("%s ="%(key,), val)
    return zips.fetch(1000)

def send_email(recipient, sender, subject, body, html=None):
    html = html or body
    from google.appengine.api import mail
    mail.send_mail(to=recipient, sender=sender,
        subject=subject, body=body, html=html)