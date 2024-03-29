/*
This module supports video playback.

### video players
We support DTube, BitChute, Rumble, Odysee, lbryplayer, UGETube, GabTV, Vimeo, YouTube, Google Video, Facebook, and uStream.

### raw formats
We support mp4, ogg, webm, and mov.

Typically, you'll want to use the fit() function.

### CT.video.fit(video)
	- returns stringified html for a video node fitting snugly inside its parent
*/

CT.video = {
	// video link detection and parsing
	"rawVidTypes": ["mp4", "ogg", "webm", "mov"],
	"player2url": {
		"facebook": "www.facebook.com/",
		"google": "video.google.com?docid=",
		"youtube": "www.youtube.com/watch?v=",
		"vimeo": "vimeo.com/",
		"ustream": "www.ustream.tv/recorded/",
		"mp4": "", "ogg": "", "webm": "", "mov": ""
	},
	"embed_url": {
		"facebook": "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2F",
		"youtube": location.protocol + "//www.youtube.com/embed/",
		"vimeo": "//player.vimeo.com/video/",
		"dtube": "https://emb.d.tube/#!/",
		"rumble": "https://rumble.com/embed/",
		"odysee": "https://odysee.com/$/embed/",
		"ugetube": "https://ugetube.com/embed/",
		"bitchute": "https://www.bitchute.com/embed/",
		"gab": "https://tv.gab.com/channel/",
		"lbryplayer": "https://cdn.lbryplayer.xyz/api/v4/streams/free/",
		"conspyre": "https://conspyre.tv/videoEmbed/"
	},
	"urlFromData": function(player, docid) {
		return player ? (location.protocol + "//" + CT.video.player2url[player] + docid) : "";
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
		if (url.indexOf("d.tube") != -1)
			return url.split("/v/")[1];
		else if (url.indexOf("bitchute.com") != -1)
			return url.split("/video/")[1];
		else if (url.indexOf("rumble.com") != -1)
			return url.split("/embed/")[1];
		else if (url.indexOf("video.google.com") != -1)
			return CT.video.getQSParam(url, "docid");
		else if (url.indexOf("youtube.com") != -1)
			return CT.video.getQSParam(url, "v");
		else if (url.indexOf("youtu.be") != -1)
			return url.slice(url.lastIndexOf("/") + 1);
		else if (url.indexOf("vimeo.com") != -1)
			return url.slice(url.lastIndexOf('/') + 1);
		else if (url.indexOf("facebook.com") != -1 && url.indexOf("video") != -1)
			return encodeURIComponent(url.split("facebook.com/")[1]);
		else if (url.indexOf("ustream.tv/recorded/") != -1)
			return url.split("recorded/")[1].split("?")[0];
		else if (url.indexOf("lbryplayer.xyz") != -1)
			return url.slice(47);
		else if (url.indexOf("odysee.com") != -1)
			return url.slice(27);
		else if (url.indexOf("ugetube.com") != -1)
			return url.split("_")[1].split(".")[0];
		else if (url.indexOf("tv.gab.com") != -1)
			return url.split("/channel/")[1].replace("/view/", "/embed/");
		else if (url.includes("conspyre.tv"))
			return url.split("/video/").pop();
		var spliturl = url.split('.'),
			ext = spliturl[spliturl.length - 1];
		if (CT.video.rawVidTypes.indexOf(ext) != -1) // eventually do more about ssl
			return url;//.replace("http://", "").replace("https://", "");
		return "";
	},
	"playerFromUrl": function(url) {
		if (url.indexOf("bitchute.com") != -1)
			return "bitchute";
		if (url.indexOf("rumble.com") != -1)
			return "rumble";
		if (url.indexOf("d.tube") != -1)
			return "dtube";
		if (url.indexOf("facebook.com") != -1 && url.indexOf("video") != -1)
			return "facebook";
		if (url.indexOf("video.google.com") != -1)
			return "google";
		if (url.indexOf("youtube.com") != -1 || url.indexOf("youtu.be") != -1)
			return "youtube";
		if (url.indexOf("vimeo.com") != -1)
			return "vimeo";
		if (url.indexOf("ustream.tv") != -1)
			return "ustream";
		if (url.indexOf("lbryplayer.xyz") != -1)
			return "lbryplayer";
		if (url.indexOf("odysee.com") != -1)
			return "odysee";
		if (url.indexOf("ugetube.com") != -1)
			return "ugetube";
		if (url.indexOf("tv.gab.com") != -1)
			return "gab";
		if (url.includes("conspyre.tv"))
			return "conspyre";
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
		if (["facebook", "dtube", "bitchute"].indexOf(video.player) != -1) {
			if (typeof w == "number") {
				h = w * 315 / 560; // w 560 h 315
				dims = "width=" + w + " height=" + h;
			} else
				w = 254; // maybe?
//		} else { // eh ........
//			w = "100%";
//			dims = "width=100% height=auto";
		}
		var ifs = ' style="border:none;overflow:hidden;max-width:100%;"',
			iurl = CT.video.embed_url[video.player] + video.docid,
			vsp = 'onclick="arguments[0].stopPropagation();"';
		if (!core.config.nolazy) { // regardless of CT.info.mobile...
			ifs += " loading=lazy";
			vsp += " preload=metadata";
		}
		if (["odysee", "ugetube", "dtube", "bitchute", "rumble", "gab", "conspyre"].includes(video.player))
			return '<iframe ' + dims + ifs + ' src="' + iurl + '" frameborder="0" allowfullscreen></iframe>';
		else if (video.player == "facebook")
			return '<iframe src="' + iurl + '&show_text=0&width=' + w + '" ' +  dims + ifs + ' scrolling="no" frameborder="0" allowTransparency="true" allowFullScreen="true"></iframe>';
		else if (video.player == "google")
			return "<embed " + dims + " id=VideoPlayback src=" + location.protocol + "//video.google.com/googleplayer.swf?docid=" + video.docid + "&hl=en&fs=true allowFullScreen=true allowScriptAccess=always type=application/x-shockwave-flash> </embed>";
		else if (video.player == "youtube" || video.player == "vimeo")
			return "<iframe src=\"" + iurl + "?html5=1\" " + dims + ifs + " frameborder=0 webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>";
		else if (video.player == "ustream")
			return "<object type=application/x-shockwave-flash data=" + location.protocol + "//static-cdn1.ustream.tv/swf/live/viewerqos:21.swf " + dims + "id=utv" + video.docid + " name=utv" + video.docid + "><param name=flashvars value=autoplay=true&locale=en_US&referrer=http%3A%2F%2Fwww.ustream.tv%2Frecorded%2F" + video.docid + "%3Futm_campaign%3Dustre.am%26utm_source%3Dustre.am%2F%3A44gEy%26utm_medium%3Dsocial%26utm_content%3D20150324210416&autoResize=false&enablejsapi=true&sv=6&volume=1&ts=1427256261325&vid=" + video.docid + "&loc=" + video.docid + "&hasticket=false><param name=allowfullscreen value=true><param name=allowscriptaccess value=always><param name=bgcolor value=000000><param name=wmode value=transparent></object>"
		else if (video.player == "lbryplayer")
			return "<video " + dims + " controls style='max-width:100%' src=" + iurl + " " + vsp + "></video>";
		else if (CT.video.rawVidTypes.indexOf(video.player) != -1)
			return "<video " + dims + " " + vsp + " controls style='max-width:100%'><source src=" + video.docid + " type=video/" + video.player + "></video>";
		else
			alert("unknown video player: "+video.player);
	},
	"embed": function(video, small) {
		var w = small ? 375 : 400;
//		var h = small ? 315 : 335;
		var h = small ? 180 : 220;
		return CT.video._embed(video, w, h);
	},
	"fit": function(video) {
		return CT.video._embed(video, "90%", "90%");
	},
	"full": function(video) {
		return CT.video._embed(video, "100%", "100%");
	},
	"unthumb": function(key, rand, e) {
		var n = CT.dom.id("thumb" + rand + key);
		n.classList.remove("vidthumb");
		CT.dom.setContent(n, CT.video.embed(CT.data.get(key)));
		e && e.stopPropagation();
	},
	"thumbnail": function(video, htmlSafe) {
		if (htmlSafe) {
			var rand = Math.floor(Math.random() * 1000);
			return '<div class="vidthumb" id="thumb' + rand + video.key + '"><img class="w1 pointer" src="' + video.thumbnail
				+ '" onclick="__ctv_unthumb(\'' + video.key + '\', ' + rand + ', arguments[0])"></div>';
		}
		var thumb = CT.dom.img(video.thumbnail, "w1", function() {
			thumb.parentNode.innerHTML = CT.video.embed(video);
		}, null, null, null, null, "vidthumb");
		return CT.dom.div(thumb);
	}
};

window.__ctv_unthumb = CT.video.unthumb;