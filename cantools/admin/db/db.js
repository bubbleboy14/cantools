CT.require("CT.all");
CT.require("CT.admin.core");
CT.require("CT.admin.db");

CT.onload(function() {
	CT.admin.db.init();
});