// thanks Muaz https://stackoverflow.com/questions/11642926/stop-close-webcam-which-is-opened-by-navigator-getusermedia
MediaStream.prototype.stop = function() {
    this.getAudioTracks().forEach(function(track) {
        track.stop();
    });

    this.getVideoTracks().forEach(function(track) {
        track.stop();
    });
};