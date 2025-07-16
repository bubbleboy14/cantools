from __future__ import absolute_import # for io.BytesIO
from io import BytesIO
import os, magic
from fyg.util import log, read, write, rm
from .system import cmd, output, cp, mkdir
try:
	from PIL import Image
except:
	pass#print("no PIL.Image")

#
# general
#
_ii = 0
def get(url, ext="jpg", pref=""):
	global _ii
	from cantools.web import fetch
	_ii += 1
	f = "%s%s.%s"%(pref, _ii, ext)
	cp(fetch(url), f)
	return f

def dl(ilist, ext="jpg", pref=""):
	fnames = []
	for url in read(ilist).split("\n"):
		if " " in url:
			fnames.append([get(u, ext, pref) for u in url.split(" ")])
		else:
			fnames.append(get(url, ext, pref))
	return fnames

def o2f(outname, inames, ext="jpg", pref=""):
	if outname.endswith(".list"):
		inames = dl(outname, ext, pref)
		outname = outname.split(".").pop(0)
	return outname, inames

#
# video (ffmpeg)
#

def dlp(url, opath=None, tarform="mp4", size="+size"):
	ytc = "yt-dlp -f %s -S %s"%(tarform, size)
	if opath:
		ytc = "%s -o %s"%(ytc, opath)
	cmd("%s %s"%(ytc, url))

def thumb(vname, src=".", dest=".", vext="mp4", forceDest=False, overwrite=False):
	if "." in vname:
		vpath = vname
		vname = vname.split(".")[0]
	else:
		vpath = "%s/%s.%s"%(src, vname, vext)
	dpath = os.path.join(dest, vname.rsplit("/", 1)[0])
	dname = "%s/%s.jpg"%(dest, vname)
	if forceDest:
		os.path.isdir(dpath) or mkdir(dpath, True)
	if overwrite or not os.path.exists(dname):
		cmd('ffmpeg -i %s -vf "thumbnail" -frames:v 1 %s'%(vpath, dname))

def concat(outname, *vnames):
	outname, vnames = o2f(outname, vnames, "mp4")
	flist = "\n".join(map(lambda vn : "file %s"%(vn,), vnames))
	cp(flist, "files.list")
	cmd("ffmpeg -f concat -i files.list -c copy %s.mp4"%(outname,))

TRANS = "ffmpeg -y -i %s -loglevel error -stats -c:a aac -movflags +faststart -f mp4 _tmp"
BASELINE = "ffmpeg -y -i %s -loglevel error -stats -c:a aac -profile:v baseline -level 3.0 -movflags +faststart -f mp4 _tmp"
SLOW = "ffmpeg -y -i %s -loglevel error -stats -c:v libx264 -preset veryslow -c:a aac -movflags +faststart -f mp4 _tmp"
FAST = "ffmpeg -y -i %s -loglevel error -stats -c:v copy -c:a copy -movflags +faststart -f mp4 _tmp"
#SEG = "ffmpeg -i %s -loglevel error -stats -map 0 -codec:v libx264 -codec:a aac -f ssegment -segment_list %s/list.m3u8 -segment_list_flags +live -segment_time 10 %s/%%03d.ts"
SEG = 'ffmpeg -i %s -loglevel error -stats -c:v libx264 -c:a copy -r 30 -x264opts "keyint=60:min-keyint=60" -forced-idr 1 -f ssegment -segment_list %s/list.m3u8 -segment_time 10 %s/%%03d.ts'
MOOV = "ffmpeg -v trace -i %s 2>&1 | grep -e \"'mdat' parent\" -e \"'moov' parent\""

def shouldMoveMoov(fpath):
	return "moov" in output(MOOV%(fpath,)).split("\n").pop()

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
# audio (ffmpeg)
#

def repitch(fname, pitch, ext="mp3"):
	log("repitch(%s, %s, %s)"%(pitch, fname, ext))
	cmd('ffmpeg -i %s.%s -af "rubberband=pitch=%s" %s-tmp.%s'%(fname,
		ext, pitch, fname, ext))
	cmd("mv %s-tmp.%s %s.%s"%(fname, ext, fname, ext))

def mp3ize(ext=".wav", path="."):
	fnames = os.listdir(path)
	log("you asked for it! scanning %s files for %s"%(len(fnames), ext), important=True)
	for fname in fnames:
		if fname.endswith(ext):
			cmd('ffmpeg -i "%s" "%s.mp3"'%(fname, fname[:-4]))

#
# images (identify, convert, montage, PIL)
#

class Tiler(object):
	def __init__(self, images, outname, vertical=True):
		self.vertical = vertical
		self.outname = outname
		self.images = images
		self.final = []
		self.geos = {}
		self.reduce()
		self.assess()
		self.resize()

	def dims(self, ipath):
		xy = output("identify %s"%(ipath,)).split(" ")[2].split("x")
		return {
			"x": int(xy[0]),
			"y": int(xy[1])
		}

	def reduce(self):
		for i in range(len(self.images)):
			iline = self.images[i]
			if type(iline) == list:
				newname = "".join([n.split(".").pop(0) for n in iline])
				Tiler(iline, newname, not self.vertical).render()
				self.images[i] = "%s.jpg"%(newname,)

	def assess(self):
		dim = self.vertical and "x" or "y"
		self.smallest = None
		for image in self.images:
			self.geos[image] = self.dims(image)
			if not self.smallest or self.geos[image][dim] < self.geos[self.smallest][dim]:
				self.smallest = image

	def _resizer(self):
		sdim = str(self.geos[self.smallest][self.vertical and "x" or "y"])
		resizer = ['convert "%s" -resize']
		resizer.append(self.vertical and sdim or ("x" + sdim))
		resizer.append('"%s"')
		return " ".join(resizer)

	def resize(self):
		resizer = self._resizer()
		for image in self.images:
			if image == self.smallest:
				self.final.append(image)
			else:
				sname = image.replace(".jpg", "s.jpg")
				cmd(resizer%(image, sname))
				self.final.append(sname)

	def _renderer(self):
		montager = ['montage "%s" -geometry +2+2']
		self.vertical and montager.append("-tile 1x")
		montager.append('"%s.jpg"')
		return " ".join(montager)

	def render(self):
		cmd(self._renderer()%('" "'.join(self.final), self.outname))

def autotile(outname, vertical=True, inames=[]):
	outname, inames = o2f(outname, inames)
	Tiler(inames or os.listdir(), outname, vertical).render()

def vtile(outname, *inames):
	autotile(outname, inames=inames)

def htile(outname, *inames):
	autotile(outname, False, inames)

def crop(img, constraint):
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

def jpgize(path, fromform=None, overwrite=False):
	opath = path
	if not overwrite and input("overwrite %s? [Y/n] "%(path,)).lower().startswith("n"):
		opath = input("ok, what should we call the output file? ")
	if fromform == "TIFF":
		Image.open(BytesIO(read(path, binary=True))).save(opath, format="JPEG")
	else:
		cmd("convert %s tmp.jpg; mv tmp.jpg %s"%(path, opath))

_p2 = []
class ImageResizer(object):
	def __init__(self, img):
		self.img = img
		self.high = max(img.size)
		[self.width, self.height] = img.size
		log("loaded with size: %sx%s"%img.size)

	def closest(self, n):
		for p in _p2:
			if n >= p:
				return p

	def s2p2(self):
		divisor = self.high / self.closest(self.high)
		return (self.closest(self.width / divisor), self.closest(self.height / divisor))

	def resize(self):
		dims = self.s2p2()
		log("resizing to: %sx%s"%dims)
		rimg = self.img.resize(dims)
		with BytesIO() as outbytes:
			rimg.save(outbytes, format=self.img.format)
			return outbytes.getvalue()

def _initp2():
	if not _p2:
		n = 16
		while n <= 1024:
			_p2.append(n)
			n *= 2
		_p2.reverse()

def resizep2(data):
	_initp2()
	return ImageResizer(Image.open(BytesIO(data))).resize()

def p2(path, overwrite=False):
	opath = path
	resized = resizep2(read(path, binary=True))
	if not overwrite and input("overwrite %s? [Y/n] "%(path,)).lower().startswith("n"):
		opath = input("ok, what should we call the output file? ")
	write(resized, opath, binary=True)

def imeta(f, silent=False):
	_initp2()
	magstr = magic.from_file(f)
	if "image" not in magstr:
		return
	fm = magstr.split(" ").pop(0)
	d = {}
	m = {
		"format": fm,
		"dims": d
	}
	w = None
	h = None
	if fm == "JPEG":
		[w, h] = magstr.split(", ")[-2].split("x")
	elif fm == "PNG":
		[w, h] = magstr.split(", ")[1].split(" x ")
	elif fm == "TIFF":
		parts = magstr.split("=")
		[w, h] = [parts[-1], parts[2].split(", ").pop(0)]
	if w:
		d["width"] = w = int(w)
		d["height"] = h = int(h)
	m["p2"] = w in _p2 and h in _p2
	silent or log(m)
	return m

def scanp2(overwrite=False):
	for f in os.listdir():
		m = imeta(f, True)
		if m:
			print(f, m)
			overwrite and not m["p2"] and p2(f)