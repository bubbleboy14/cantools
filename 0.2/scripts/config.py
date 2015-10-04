PARSE_ERROR_SEGMENT_LENGTH = 100
BUILD_DIRS = {
	"static": "../html-static",
	"production": "../html-production"
}
JSFLAG = '<script src="'
JSOFFSET = len('<script src="')
JSENDOFFSET = len('"></script>')
NOSCRIPT = """
<noscript>
 <div style="position: absolute; left:0px; top:0px;">
  This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.
 </div>
</noscript>
"""
YPATH = "../app.yaml"
YSTART = "# START mode: "
YEND = "# END mode: "
ENC_TOGGLE_PATH = "../cantools.py"
ENC_TOGGLE_STR = "ENCODE = %s"