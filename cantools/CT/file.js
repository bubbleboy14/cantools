/*
This module provides functions and a class (CT.file.File) for
messing with (accessing, uploading, downloading) file objects.
*/

CT.file = {
	getter: function(cb, multi) { // upload input element
		var f = CT.dom.file(function(e) {
			if (multi) {
				var files = []; // can't map, f.files is not a real array
				for (var i = 0; i < f.files.length; i++)
					files.push(new CT.file.File({
						input: f,
						path: f.value,
						file: f.files[i]
					}));
				cb(files);
			} else {
				cb(new CT.file.File({
					input: f,
					path: f.value,
					file: f.files[0]
				}));
			}
		}, null, null, multi);
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
	upload: function(path, cb, params) {
		var data = this.opts.file, headers = {};
		if (params) {
			headers["Content-Type"] = "multipart/form-data";
			data = new FormData();
			for (var param in params)
				data.append(param, params[param]);
			data.append("data", this.opts.file);
		}
		CT.net.put(path, data, cb, headers, true);
	},
	init: function(opts) {
		this.opts = opts;
		if (opts.input)
			opts.input.ctfile = this;
		this.url = window.URL.createObjectURL(opts.file);
	}
});