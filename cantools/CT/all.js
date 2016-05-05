"""
This loader imports almost every CT module.

This includes:
 - CT.Pager
 - CT.Slider
 - CT.align
 - CT.autocomplete
 - CT.canvas
 - CT.data
 - CT.db
 - CT.drag
 - CT.dom
 - CT.gesture
 - CT.mobile
 - CT.modal
 - CT.panel
 - CT.parse
 - CT.pubsub
 - CT.recaptcha
 - CT.storage
 - CT.trans
 - CT.upload
 - CT.video

This excludes CT.map and CT.rte, which require large script
imports, as well as CT.admin, which is not for typical use.
"""

CT.require("CT.Pager");
CT.require("CT.Slider");
CT.require("CT.align");
CT.require("CT.autocomplete");
CT.require("CT.canvas");
CT.require("CT.data");
CT.require("CT.db");
CT.require("CT.drag");
CT.require("CT.dom");
CT.require("CT.gesture");
CT.require("CT.mobile");
CT.require("CT.modal");
CT.require("CT.panel");
CT.require("CT.parse");
CT.require("CT.pubsub");
CT.require("CT.recaptcha");
CT.require("CT.storage");
CT.require("CT.trans");
CT.require("CT.upload");
CT.require("CT.video");