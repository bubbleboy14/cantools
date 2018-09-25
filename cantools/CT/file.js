/*
This module provides functions and a class (CT.file.File) for
messing with (accessing, uploading, downloading) file objects.
*/

CT.file = {
	dragdrop: function(cb, classname, label, id, multi) {
		id = id || ("dd" + Math.floor(Math.random() * 1000));
		return CT.dom.div([
			CT.dom.label(label || "drag file here", id),
			CT.file.getter(cb, multi, "transparent", id)
		], classname);
	},
	getter: function(cb, multi, classname, id) { // upload input element
		var f = CT.dom.file(function(e) {
			if (multi) {
				var files = []; // can't map, f.files is not a real array
				for (var i = 0; i < f.files.length; i++)
					files.push(new CT.file.File({
						input: f,
						path: f.files[i].name,
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
		}, id, classname, multi);
		return f;
	},
	make: function(data) { // from data
		if (!Array.isArray(data))
			data = [data];
		return new CT.file.File({
			file: new Blob(data)
		});
	}
};

CT.file.File = CT.Class({
	CLASSNAME: "CT.file.File",
	download: function(dname, lname, dclass) {
		lname = lname || "download";
		var l = CT.dom.link(lname, null,
			this.url, dclass, null, null, true);
		l.download = dname || this.name() || lname;
		return l;
	},
	name: function() {
		return this.opts.path && this.opts.path.split("\\").pop();
	},
	upload: function(path, cb, params) {
		var data = this.opts.file, headers = {};
		if (params) {
			headers["Content-Type"] = "multipart/form-data";
			data = CT.net.formData(this.opts.file, params);
		}
		CT.net.put(path, data, cb, headers, true, null, null, true);
	},
	init: function(opts) {
		this.opts = opts;
		if (opts.input)
			opts.input.ctfile = this;
		this.url = window.URL.createObjectURL(opts.file);
	}
});