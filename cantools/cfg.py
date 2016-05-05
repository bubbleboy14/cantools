cfg = {
	"log": {
		"allow": ["info", "log", "error"]
	},
	"geo": {
		"test": False,
		"zip": "google", # google|geonames
		"user": {
			"geonames": ["demo"],
			"google": [""]
		}
	},
	"memcache": {
		"request": False,
		"db": True
	},
	"admin": {
		"host": "localhost",
		"port": 8002
	},
	"web": {
		"server": "dez",
		"host": "0.0.0.0",
		"port": 8080,
		"log": None
	},
	"db": { # switch on web backend (override w/ DB)
		"gae": "data.db",
		"dez": "sqlite:///data.db",
		"test": "sqlite:///data_test.db",
		"echo": False,
		"public": True # read from db without credentials via _db.py web handler
	},
	"encode": False,
	"mailer": None, # (override w/ MAILER)
	"pubsub": {
		"host": "localhost",
		"port": 8888,
		"history": 10,
		"botnames": [],
		"bots": {},
		"log": None
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
		"vcignore": {
			".": ["*pyc", "*~", ".ctp", "_", "admin.py", "_db.py", "logs"],
			"css": ["ct.css"],
			"js": ["CT"],
			"html-production": ["CT"]
		},
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
  			"core": """
- url: /css
  static_dir: css

- url: /img
  static_dir: img

- url: /_db
  script: _db.py

## MODE SWITCHING -- DON'T MESS WITH (unless you know what you're doing)!
# START mode: dynamic
- url: /js
  static_dir: js
- url: /.*\.html
  static_dir: html
# END mode: dynamic
# START mode: static
#- url: /js
#  static_dir: js
#- url: /.*\.html
#  static_dir: html-static
# END mode: static
# START mode: production
#- url: /.*\.html
#  static_dir: html-production
# END mode: production"""
		},
		"html": """<!doctype html>
<html>
  <head>
    <title>%s</title>
    <link rel="stylesheet" href="/css/ct.css">
    <script src="/js/CT/ct.js"></script>
  </head>
  <body>
  </body>
</html>""",
		"ctcfg": 'ENCODE = False\nMODE = dynamic\nWEB_SERVER = %s'
	}
}