CT.stream.Streamer = CT.Class({ // primarily useful for testing
	CLASSNAME: "CT.stream.Streamer",
	bounce: function(signature, blob) {
		var video = this.opts.video;
		CT.stream.util.read(blob, function(result) {
			CT.memcache.set(signature, result, function() {
				CT.memcache.get(signature, video.process, true);
			}, true);
		});
	},
	chunk: function(blob, segment) {
		this.bounce(this.opts.channel + segment, blob);
	},
	echo: function(blobs, segment) {
		this.opts.video.process(blobs.video);
	},
	getNode: function() {
		return this.opts.video.node;
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			channel: "test",
			video: new CT.stream.Video(opts.vopts)
		});
	}
});