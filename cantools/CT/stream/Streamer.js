CT.stream.Streamer = CT.Class({ // depped
	CLASSNAME: "CT.stream.Streamer",
	bounce: function(signature, blob) {
		var video = this.opts.video;
		CT.stream.read(blob, function(result) {
			CT.memcache.set(signature, result, function() {
				CT.memcache.get(signature, video.process, false, true);
			}, false, true);
		});
	},
	chunk: function(blob, segment) {
		this.bounce(this.opts.channel + segment, blob);
	},
	echo: function(blob, segment) {
		CT.stream.read(blob, this.opts.video.process);
	},
	getNode: function() {
		return this.opts.video.node;
	},
	init: function(opts) {
		this.opts = CT.merge(opts, {
			channel: "test",
			video: new CT.stream.Video()
		});
	}
});