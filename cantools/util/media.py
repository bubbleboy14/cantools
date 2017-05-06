import os
from system import cmd, rm, mkdir
from reporting import log
from io import read, write

#
# video (ffmpeg)
#

TRANS = "ffmpeg -y -i %s -loglevel error -stats -c:a aac -movflags +faststart -f mp4 _tmp"
BASELINE = "ffmpeg -y -i %s -loglevel error -stats -c:a aac -profile:v baseline -level 3.0 -movflags +faststart -f mp4 _tmp"
SLOW = "ffmpeg -y -i %s -loglevel error -stats -c:v libx264 -preset veryslow -c:a aac -movflags +faststart -f mp4 _tmp"
FAST = "ffmpeg -y -i %s -loglevel error -stats -c:a copy +faststart -f mp4 _tmp"
#SEG = "ffmpeg -i %s -loglevel error -stats -map 0 -codec:v libx264 -codec:a aac -f ssegment -segment_list %s/list.m3u8 -segment_list_flags +live -segment_time 10 %s/%%03d.ts"
SEG = 'ffmpeg -i %s -loglevel error -stats -c:v libx264 -c:a copy -r 30 -x264opts "keyint=60:min-keyint=60" -forced-idr 1 -f ssegment -segment_list %s/list.m3u8 -segment_time 10 %s/%%03d.ts'

def transcode(orig, tmp=False, fast=True, slow=False, baseline=False):
	if tmp: # orig is _data_, not _path_
		log("media.transcode > writing to tmp file", 1)
		data = orig
		orig = "_tctmp"
		write(data, orig, binary=True)
	log("media.transcode > optimizing for mobile (%s)"%(orig,), 1)
	cmd((baseline and BASELINE or slow and SLOW or fast and FAST or TRANS)%(orig,))
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

def hlsify(blobpath, check=False):
	p = blobpath.replace("blob/", "blob/hls/")
	isd = os.path.isdir(p)
	if check:
		return isd
	if not isd:
		log("transcode > attempt with video: '%s'"%(blobpath,), important=True)
		mkdir(p, True)
		segment(blobpath, p)
		log("transcode > done!")

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

