cfg = {
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
		"path": "ctcfg.py",
		"enc": "ENCODE = %s",
		"mode": 'MODE = "%s"'
	},
	"noscript": """
		<noscript>
		 <div style="position: absolute; left:0px; top:0px;">
		  This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.
		 </div>
		</noscript>
	""",
	"init": {
		"yaml": """application: %s
version: 1
runtime: python27
api_version: 1
threadsafe: false

handlers:
- url: /remote_api
  script: $PYTHON_LIB/google/appengine/ext/remote_api/handler.py
  login: admin

## MODE SWITCHING -- DON'T MESS WITH (unless you know what you're doing)!
# START mode: dynamic
- url: /javascript
  static_dir: javascript
- url: /.*\.(html|css)
  static_dir: html
# END mode: dynamic
# START mode: static
#- url: /javascript
#  static_dir: javascript
#- url: /.*\.(html|css)
#  static_dir: html-static
# END mode: static
# START mode: production
#- url: /.*\.(html|css)
#  static_dir: html-production
# END mode: production""",
		"css": """/* required CT classes */
.activetab a {
    color: #670002;
}
.basicpopup {
    z-index: 5;
    position: fixed;
    padding: 10px;
    background: white;
    border: 1px solid black;
}
.bigger {
    font-size: 140%;
}
.blue {
    color: #010068;
}
.bold {
    font-weight: bold;
}
.bordered {
    border: 1px solid #d3d3d3;
}
.bottom_out {
    bottom: -150px !important;
}
.bottompadded {
    padding-bottom: 10px;
}
.button_row {
    position: absolute;
    text-align: center;
    pointer-events: none;
    -webkit-transition: top 1s, bottom 1s;
    -moz-transition: top 1s, bottom 1s;
    -o-transition: top 1s, bottom 1s;
    transition: top 1s, bottom 1s;
    right: 0px;
    left: 0px;
}
.button_row div {
    margin: 2px;
    display: inline-block;
    background: rgba(255, 255, 255, 0.75);
    pointer-events: auto;
    cursor: pointer;
}
.centered {
    text-align: center;
}
.centeredimg img {
    margin-left: auto;
    margin-right: auto;
}
.clearnode {
    clear: both;
}
.fullwidth {
    width: 100%;
}
.gray {
    color: gray;
}
.hidden {
    display: none;
}
.lfloat {
    float: left;
}
.nodecoration,
.nodecoration a {
    text-decoration: none;
}
.nowrap {
    white-space: nowrap;
}
.padded {
    padding: 10px;
}
.right {
    float: right;
}
.round {
    border-radius: 5px 5px 5px 5px;
    -moz-border-radius: 5px;
    -webkit-border-radius: 5px;
}
.rpaddedsmall {
    padding-right: 2px;
}
.shiftleft {
    margin-left: -18px;
}
.small {
    font-size: 80%;
}
.top_out {
    top: -250px !important;
}
.vmiddle {
    vertical-align: middle;
}
.w280 {
    width: 280px;
}

/* required CT ids */
#top_buttons {
    top: 3px;
}
#bottom_buttons {
    bottom: 30px;
}
#resize_btn, #mobile_menu_btn {
    cursor: pointer;
    position: absolute;
    top: 5px;
    z-index: 10;
}
#resize_btn {
    left: 5px;
}
#mobile_menu_btn {
    right: 5px;
}
#resize_btn div, #mobile_menu_btn div {
    background: rgba(255, 255, 255, 0.75);
}
#mobile_search {
    width: 90%;
}
#mobile_search_node {
    display: block;
    height: 35px;
    margin-right: 65px;
    margin-left: 65px;
}
#mobile_search_node div {
    display: block;
    margin-top: -5px;
}

/* some extras for funsies */
.big {
    font-size: 120%;
}
.italic {
    font-style: italic;
}
.pointer {
    cursor: pointer;
}
.smaller {
    font-size: 60%;
}
.transparent {
    opacity: 0;
}""",
		"ctcfg": 'ENCODE = False\nMODE = "dynamic"'
	}
}