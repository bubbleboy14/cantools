CT.require("CT.dom");
CT.require("CT.panel");
CT.require("CT.admin.core");
CT.require("CT.admin.memcache");

CT.onload(function() {
	CT.admin.memcache.init();
});