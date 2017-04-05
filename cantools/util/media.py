from system import cmd, rm
from reporting import log
from io import read, write

#
# video (ffmpeg)
#

TRANS = "ffmpeg -y -i %s -loglevel error -stats -c:a copy -profile:v baseline -level 3.0 -movflags +faststart -f mp4 _tmp"
#TRANS = "ffmpeg -y -i %s -loglevel error -stats -c:a aac -profile:v baseline -level 3.0 -movflags +faststart -f mp4 _tmp"
#SEG = "ffmpeg -i %s -loglevel error -stats -map 0 -codec:v libx264 -codec:a aac -f ssegment -segment_list %s/list.m3u8 -segment_list_flags +live -segment_time 10 %s/%%03d.ts"
SEG = 'ffmpeg -i %s -loglevel error -stats -c:v libx264 -c:a copy -r 30 -x264opts "keyint=60:min-keyint=60" -forced-idr 1 -f ssegment -segment_list %s/list.m3u8 -segment_time 10 %s/%%03d.ts'

def transcode(orig, tmp=False):
	if tmp: # orig is _data_, not _path_
		log("media.transcode > writing to tmp file", 1)
		data = orig
		orig = "_tctmp"
		write(data, orig, binary=True)
	log("media.transcode > optimizing for mobile (%s)"%(orig,), 1)
	cmd(TRANS%(orig,))
	data = read(binary=True)
	if not tmp:
		log("media.transcode > overwriting original; removing tmp file", 1)
		write(data, orig, binary=True)
	rm("_tmp")
	if tmp:
		rm(orig)
		return data

def segment(orig, p):
	log("media.segment > segmenting to %s (hls)"%(p,), 1)
	cmd(SEG%(orig, p, p))

#
# images (PIL)
#

def crop(img, constraint):
	from PIL import Image
	w = img.size[0]
	h = img.size[1]
	smaller = min(w, h)
	if smaller == w: # clean these up...
		fromx = 0
		tox = w
		fromy = (h - w) / 2.0
		toy = fromy + w
	else:
		fromy = 0
		toy = h
		fromx = (w - h) / 2.0
		tox = fromx + h
	return img.crop((int(fromx), int(fromy), int(tox),
		int(toy))).resize((constraint, constraint), Image.ANTIALIAS)

