/*
This loader imports almost every CT module.

### This includes:
    - CT.Drop
    - CT.Pager
    - CT.align
    - CT.autocomplete
    - CT.canvas
    - CT.chat
    - CT.data
    - CT.db *
    - CT.drag
    - CT.dom
    - CT.file
    - CT.gesture
    - CT.hover
    - CT.key
    - CT.memcache *
    - CT.mobile
    - CT.modal
    - CT.panel
    - CT.parse
    - CT.pubsub *
    - CT.recaptcha
    - CT.slider
    - CT.stream *
    - CT.storage
    - CT.trans
    - CT.upload *
    - CT.video

* tightly coupled to backend

### This excludes:
    - CT.map, CT.pay, and CT.rte, which require large script imports
    - CT.admin, which is not for typical use.
*/

CT.require("CT.Drop");
CT.require("CT.Pager");
CT.require("CT.align");
CT.require("CT.autocomplete");
CT.require("CT.canvas");
CT.require("CT.chat");
CT.require("CT.data");
CT.require("CT.db");
CT.require("CT.drag");
CT.require("CT.dom");
CT.require("CT.file");
CT.require("CT.gesture");
CT.require("CT.hover");
CT.require("CT.key");
CT.require("CT.layout");
CT.require("CT.memcache");
CT.require("CT.mobile");
CT.require("CT.modal");
CT.require("CT.panel");
CT.require("CT.parse");
CT.require("CT.pubsub");
CT.require("CT.recaptcha");
CT.require("CT.slider");
CT.require("CT.stream");
CT.require("CT.storage");
CT.require("CT.trans");
CT.require("CT.upload");
CT.require("CT.video");