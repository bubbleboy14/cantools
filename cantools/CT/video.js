/*
This module supports video playback.

### video players
We support Google Video, YouTube, Vimeo, and uStream.

### raw formats
We support mp4, ogg, and webm.

Typically, you'll want to use the embed() function.

### CT.video.embed(video, small) - returns stringified html
	- video (string): link to video content
	- small (bool): if true, make it smaller

TODO: replace 'small' bool with flexible styling.
*/

CT.video = {
	// video link detection and parsing
	"rawVidTypes": ["mp4", "ogg", "webm"],
	"player2url": {
	    "google": "video.google.com?docid=",
	    "youtube": "www.youtube.com/watch?v=",
	    "vimeo": "vimeo.com/",
	    "ustream": "www.ustream.tv/recorded/",
	    "mp4": "", "ogg": "", "webm": ""
	},
	"embed_url": {
	    "youtube": "http://www.youtube.com/embed/",
	    "vimeo": "//player.vimeo.com/video/"
	},
	"urlFromData": function(player, docid) {
	    return player ? ("http://" + CT.video.player2url[player] + docid) : "";
	},
	"getQSParam": function(url, param) {
	    var s = url.indexOf(param + "=") + param.length + 1,
	        e = url.indexOf("&", s);
	    if (e == -1)
	        e = url.indexOf("#", s);
	    if (e == -1)
	        return url.slice(s);
	    return url.slice(s, e);
	},
	"docidFromUrl": function(url) {
	    if (url.indexOf("video.google.com") != -1)
	        return CT.video.getQSParam(url, "docid");
	    else if (url.indexOf("youtube.com") != -1)
	        return CT.video.getQSParam(url, "v");
	    else if (url.indexOf("vimeo.com") != -1)
	        return url.slice(url.lastIndexOf('/') + 1);
	    else if (url.indexOf("ustream.tv/recorded/") != -1)
	        return url.split("recorded/")[1].split("?")[0];
	    var spliturl = url.split('.'),
	        ext = spliturl[spliturl.length - 1];
	    if (CT.video.rawVidTypes.indexOf(ext) != -1) // eventually do more about ssl
	        return url.replace("http://", "").replace("https://", "");
	    return "";
	},
	"playerFromUrl": function(url) {
	    if (url.indexOf("video.google.com") != -1)
	        return "google";
	    if (url.indexOf("youtube.com") != -1)
	        return "youtube";
	    if (url.indexOf("vimeo.com") != -1)
	        return "vimeo";
	    if (url.indexOf("ustream.tv") != -1)
	        return "ustream";
	    var spliturl = url.split('.'),
	        ext = spliturl[spliturl.length - 1];
	    if (CT.video.rawVidTypes.indexOf(ext) != -1)
	        return ext;
	    return "";
	},
	"videoData": function(vlink) {
	    var player = CT.video.playerFromUrl(vlink);
	    return player ? {
	        player: player,
	        docid: CT.video.docidFromUrl(vlink)
	    } : null;
	},
	"_embed": function(video, w, h) {
		var dims = "width=" + w;
		if (h)
			dims += " height=" + h;
	    if (video.player == "google")
	        return "<embed " + dims + " id=VideoPlayback src=http://video.google.com/googleplayer.swf?docid=" + video.docid + "&hl=en&fs=true allowFullScreen=true allowScriptAccess=always type=application/x-shockwave-flash> </embed>";
	    else if (video.player == "youtube" || video.player == "vimeo")
	        return "<iframe src=\"" + CT.video.embed_url[video.player] + video.docid + "?html5=1\" " + dims + " frameborder=0 webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>";
	    else if (video.player == "ustream")
	        return "<object type=application/x-shockwave-flash data=http://static-cdn1.ustream.tv/swf/live/viewerqos:21.swf " + dims + "id=utv" + video.docid + " name=utv" + video.docid + "><param name=flashvars value=autoplay=true&locale=en_US&referrer=http%3A%2F%2Fwww.ustream.tv%2Frecorded%2F" + video.docid + "%3Futm_campaign%3Dustre.am%26utm_source%3Dustre.am%2F%3A44gEy%26utm_medium%3Dsocial%26utm_content%3D20150324210416&autoResize=false&enablejsapi=true&sv=6&volume=1&ts=1427256261325&vid=" + video.docid + "&loc=" + video.docid + "&hasticket=false><param name=allowfullscreen value=true><param name=allowscriptaccess value=always><param name=bgcolor value=000000><param name=wmode value=transparent></object>"
	    else if (CT.video.rawVidTypes.indexOf(video.player) != -1)
	        return "<video " + dims + " controls><source src=http://" + video.docid + " type=video/" + video.player + "></video>";
	    else
	        alert("unknown video player: "+video.player);
	},
	"embed": function(video, small) {
	    var w = small ? 375 : 400;
	    var h = small ? 315 : 335;
	    return CT.video._embed(video, w, h);
	},
	"fit": function(video) {
		return CT.video._embed(video, "90%", "90%");
	}
};