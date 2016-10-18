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

CT.scriptImport("https://cdn.webrtc-experiment.com/MediaStreamRecorder.js");
CT.require("CT.stream.Video");
CT.require("CT.stream.Streamer");
CT.require("CT.stream.Multiplexer");

CT.stream.opts = {
	requiresInput: CT.info.android,
	requestedInput: false,
	segments: 20,
	chunk: 1000,
	width: 320,
	height: 240,
	waiting: [],
	startWaiting: function() {
		CT.stream.opts.waiting.forEach(function(w) { w.start(); });
	}
};

CT.stream.read = function(blob, cb, buffer) {
	var signature = "read" + (buffer ? "buffer" : "url"),
		fr = new FileReader();
	CT.log.startTimer(signature);
	fr.onloadend = function() {
		CT.log.endTimer(signature, fr.result.length || fr.result.byteLength);
		cb(fr.result);
	};
	buffer ? fr.readAsArrayBuffer(blob) : fr.readAsDataURL(blob);
};

CT.stream.record = function(ondata, onrecorder, onfail) {
	CT.log.startTimer("record", "attempting record");
	navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
		CT.log.endTimer("record", "got data!");
		var segment = 0, recorder = new MediaStreamRecorder(stream);
		recorder.mimeType = "video/webm";
		if (CT.info.isChrome)
			recorder.recorderType = WhammyRecorder;
		else
			recorder.recorderType = MediaRecorderWrapper;
		recorder.sampleRate = 22050;

		// this dimension stuff, as well as css rules,
		// only necessary for firefox, it seems
		recorder.videoWidth = CT.stream.opts.width;
		recorder.videoHeight = CT.stream.opts.height;
		recorder.canvas = {
			width: CT.stream.opts.width,
			height: CT.stream.opts.height
		};

		recorder.ondataavailable = function(blob) {
			CT.log("ondataavailable!!");
			segment = (segment + 1) % CT.stream.opts.segments;
			ondata && ondata(blob, segment);
		};
		recorder.start(CT.stream.opts.chunk);
		onrecorder && onrecorder(recorder, stream);
	})["catch"](onfail || function(err) {
		CT.log.endTimer("record", "got error: " + err);
	});
};