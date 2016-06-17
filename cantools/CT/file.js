/*
This module provides functions and a class (CT.file.File) for
messing with (accessing, uploading, downloading) file objects.
*/

CT.file = {
	getter: function(cb) { // upload input element. TODO: multi
		var f = CT.dom.file(function(e) {
			cb(new CT.file.File({
				input: f,
				path: f.value,
				file: f.files[0]
			}));
		});
		return f;
	},
	make: function(data) { // from data
		return new CT.file.File({
			file: new Blob([data])
		});
	}
};

CT.file.File = CT.Class({
	CLASSNAME: "CT.file.File",
	download: function(lname) {
		return CT.dom.link(lname || "download",
			null, this.url, null, null, null, true);
	},
	upload: function(path, cb) {
		CT.net.put(path, this.opts.file, cb, null, true);
	},
	init: function(opts) {
		this.opts = opts;
		if (opts.input)
			opts.input.ctfile = this;
		this.url = window.URL.createObjectURL(opts.file);
	}
});