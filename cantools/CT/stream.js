/*
This module provides functions and classes for streaming video all over town.

Highlights include:

### CT.stream.record(ondata, onrecorder, onfail)
Starts up a video stream from your webcam. Breaks stream into segments as
defined by CT.stream.opts.chunk (default 1000) and CT.stream.opts.segments
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

CT.require("CT.stream.util");
CT.require("CT.stream.Audio");
CT.require("CT.stream.Video");
CT.require("CT.stream.Streamer");
CT.require("CT.stream.Multiplexer");

CT.stream.opts = {
	requiresInput: true,//CT.info.android,
	requestedInput: false,
	segments: 10,
	chunk: 2000,
	reset: 8000,
	cutoff: 30000,
	width: 320,
	height: 240,
	waiting: [],
	transcoder: null, // set to func, such as web hook procedure
	setTranscoder: function(cb) {
		CT.stream.opts.transcoder = cb;
	},
	codecs: {
		av: 'video/webm; codecs="vp8,opus"',
		video: 'video/webm; codecs="vp8"',
		audio: 'audio/webm; codecs="opus"'
	},
	startWaiting: function() {
		CT.stream.opts.waiting.forEach(function(w) { w.play(); });
	}
};
CT.stream.opts.mropts = {
	mimeType: CT.stream.opts.codecs.video, // for OSX
//	videoBitsPerSecond: 512000,
//	audioBitsPerSecond: 32000
};