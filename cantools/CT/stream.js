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

var vpv = MediaRecorder.isTypeSupported("vp9") ? "vp9" : "vp8";

var stropts = CT.stream.opts = {
	requiresInput: true,//CT.info.android,
	requestedInput: false,
	segments: 10,
	chunk: 1000,
	reset: 2000,
	resetWait: 3000,
	cutoff: 30000,
	wakeup: 1000,
	resetLimit: "auto",
	snoozes: 0,
	width: 320,
	height: 240,
	waiting: [],
	mode: "camera",
	getter: "getUserMedia",
	getters: {
		camera: "getUserMedia",
		screenshare: "getDisplayMedia"
	},
	codecs: {
		av: 'video/webm; codecs="' + vpv + ',opus"',
		video: 'video/webm; codecs="' + vpv + '"',
		audio: 'audio/webm; codecs="opus"'
	},
	transcoder: null, // set to func, such as web hook procedure
	setTranscoder: function(cb) {
		CT.stream.opts.transcoder = cb;
	},
	setMode: function(m) {
		stropts.mode = m;
		stropts.mropts.mimeType = stropts.modes[m];
	},
	getter: function(opts, m) {
		return navigator.mediaDevices[stropts.getters[m || stropts.mode]](opts);
	},
	doPrompt: function(name, sub, cb) {
		return new CT.modal.Prompt({
			defaultIndex: 0,
			transition: "fade",
			style: "single-choice",
			data: [ sub || "Play Stream" ],
			prompt: name || "Ready to stream?",
			cb: cb || CT.stream.opts.startWaiting
		});
	},
	startWaiting: function() {
		CT.stream.opts.waiting.forEach(function(w) {
			w.play().catch(() => CT.log("play rejected!"));
		});
		CT.stream.opts.waiting = [];
	}
};
//if (CT.info.isFirefox)
//	stropts.codecs.video = stropts.codecs.av;
stropts.modes = {
	camera: stropts.codecs.av,
	screenshare: stropts.codecs.video
};
stropts.mropts = {
	mimeType: stropts.codecs.av,
//	mimeType: stropts.codecs.video, // for OSX?
	videoBitsPerSecond: 32000,
	audioBitsPerSecond: 16000
//	videoBitsPerSecond: 512000,
//	audioBitsPerSecond: 32000
};