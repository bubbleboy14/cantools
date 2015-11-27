class Config(object):
	def __init__(self, cfg):
		for key, val in cfg.items():
			self.update(key, val)

	def update(self, key, val):
		setattr(self, key,
			isinstance(val, dict) and Config(val) or val)

config = Config({
	"pubsub": {
		"port": 8888,
		"history": 10
	},
	"parse_error_segment_length": 100,
	"build": {
		"dynamic_dir": "html",
		"compiled_dirs": {
			"static": "html-static",
			"production": "html-production"
		}
	},
	"js": {
		"path": "",
		"flag": '<script src="/',
		"offset": len('<script src="'),
		"endoffset": len('"></script>')
	},
	"noscript": """
		<noscript>
		 <div style="position: absolute; left:0px; top:0px;">
		  This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.
		 </div>
		</noscript>
	""",
	"yaml": {
		"path": "app.yaml",
		"start": "# START mode: ",
		"end": "# END mode: "
	},
	"py": {
		"path": "ctcfg.py",
		"enc": "ENCODE = %s",
		"mode": 'MODE = "%s"'
	}
})