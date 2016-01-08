cfg = {
	"web_server": "dez",
	"db": "sqlite:///:memory:", # (dez only -- override)
	"mailer": None, # (override)
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
		"path": "js",
		"flag": '<script src="/',
		"offset": len('<script src="'),
		"endoffset": len('"></script>')
	},
	"yaml": {
		"path": "app.yaml",
		"start": "# START mode: ",
		"end": "# END mode: "
	},
	"py": {
		"path": "ct.cfg",
		"enc": "ENCODE = %s",
		"mode": "MODE = %s"
	},
	"noscript": """
		<noscript>
		 <div style="position: absolute; left:0px; top:0px;">
		  This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.
		 </div>
		</noscript>
	""",
	"init": {
		"yaml": {
			"gae": """application: %s
version: 1
runtime: python27
api_version: 1
threadsafe: false

handlers:
- url: /remote_api
  script: $PYTHON_LIB/google/appengine/ext/remote_api/handler.py
  login: admin""",
  			"core": """## MODE SWITCHING -- DON'T MESS WITH (unless you know what you're doing)!
# START mode: dynamic
- url: /js
  static_dir: js
- url: /.*\.(html|css)
  static_dir: html
# END mode: dynamic
# START mode: static
#- url: /js
#  static_dir: js
#- url: /.*\.(html|css)
#  static_dir: html-static
# END mode: static
# START mode: production
#- url: /.*\.(html|css)
#  static_dir: html-production
# END mode: production"""
		},
		"html": """<!doctype html>
<html>
  <head>
    <title>%s</title>
    <link rel="stylesheet" href="ct.css">
    <script src="/js/CT/ct.js"></script>
  </head>
  <body>
  </body>
</html>""",
		"ctcfg": 'ENCODE = False\nMODE = dynamic\nWEB_SERVER = %s'
	}
}