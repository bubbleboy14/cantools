/*
This module provides functions and a class (CT.file.File) for
messing with (accessing, uploading, downloading) file objects.
*/

CT.file = {
	getter: function(cb) {
		var f = CT.dom.file(function(e) {
			cb(new CT.file.File({
				input: f,
				path: f.value,
				files: f.files
			}));
		});
		return f;
	}
};

CT.file.File = CT.Class({
	CLASSNAME: "CT.file.File",
	download: function(lname) {
		return CT.dom.link(lname || "download",
			null, this.url, null, null, null, true);
	},
	upload: function(path, cb) {
		CT.net.put(path, this.opts.files[0], cb);
	},
	init: function(opts) {
		this.opts = opts;
		this.url = window.URL.createObjectURL(opts.files[0]);
	}
});