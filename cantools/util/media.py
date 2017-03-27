from system import cmd, rm
from reporting import log
from io import read, write

TRANS = "ffmpeg -y -i %s -loglevel error -stats -c:a copy -profile:v baseline -level 3.0 -movflags +faststart -f mp4 _tmp"
#TRANS = "ffmpeg -y -i %s -loglevel error -stats -c:a aac -profile:v baseline -level 3.0 -movflags +faststart -f mp4 _tmp"
SEG = "ffmpeg -i %s -loglevel error -stats -map 0 -codec:v libx264 -codec:a aac -f ssegment -segment_list %s/list.m3u8 -segment_list_flags +live -segment_time 10 %s/%%03d.ts"

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