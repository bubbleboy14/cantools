CT.require("CT.dom");
CT.require("CT.data");
CT.require("CT.trans");
CT.require("CT.panel");
CT.require("CT.modal");
CT.require("CT.pubsub");
CT.require("CT.admin.core");
CT.require("CT.admin.pubsub");

CT.onload(function() {
	CT.admin.pubsub.init();
});