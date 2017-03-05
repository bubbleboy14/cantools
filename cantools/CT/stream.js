/*
This module provides functions and classes for streaming video all over town.

Highlights include:

### CT.stream.record(ondata, onrecorder, onfail)
Starts up a video stream from your webcam. Breaks stream into segments as
defined by CT.stream.opts.chunk (default 3000) and CT.stream.opts.segments
(default 10).

### CT.stream.Multiplexer
Uses WebSocket pubsub server (ctpubsub/CT.pubsub) to manage multiple channels,
each streaming metadata pertaining to multiple videos, over a single connection.
The video segments are acquired from the server with the CT.memcache module
and passed to individual CT.stream.Video instances.

### CT.stream.Video
Wraps an HTML5 video tag in a class with functions for streaming a video
that arrives in chunks.
*/

CT.scriptImport("CT.lib.MediaStreamRecorder");
CT.require("CT.stream.util");
CT.require("CT.stream.Audio");
CT.require("CT.stream.Video");
CT.require("CT.stream.Streamer");
CT.require("CT.stream.Multiplexer");

CT.stream.opts = {
	requiresInput: CT.info.android,
	requestedInput: false,
	segments: 20,
	chunk: 2000,
	sync: {
		range: 800,
		lead: 200
	},
	cutoff: 30000,
	width: 320,
	height: 240,
	waiting: [],
	merged: false,
	codecs: {
		av: 'video/webm; codecs="vp8,opus"',
		video: 'video/webm; codecs="vp8"',
		audio: 'audio/webm; codecs="opus"'
	},
	startWaiting: function() {
		CT.stream.opts.waiting.forEach(function(w) { w.play(); });
	}
};
