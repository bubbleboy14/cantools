# cantools 0.8.15.2
This portable modern web framework is the application-neutral backbone of Civil Action Network. It includes: a pubsub WebSocket server and bot platform; swappable web backends capable of targeting high-concurrency standalone or cloud platforms; a variable-mode application compiler; a broad-spectrum ORM and database migration tools; a built in administrative interface; and a rich modular JavaScript library.

License: MIT (see LICENSE)

## Repository Installation (full)
  - upside: includes full codebase (not just Python)
  - site: https://github.com/bubbleboy14/cantools
  - steps
    - git clone https://github.com/bubbleboy14/cantools.git
    - cd cantools
    - python setup.py develop

## Package Installation (limited -- not recommended)
  - downside
    - does _not_ include full package (such as client-side web files)
    - enough to mess around with cantools -- not enough to develop end-to-end applications
  - package: https://pypi.python.org/pypi/ct
  - command: easy_install ct

## Hello World
This takes less than a moment. Pop open a terminal in your home directory:

	~$ git clone https://github.com/bubbleboy14/cantools.git
	~$ cd cantools/
	~/cantools$ python setup.py develop
	~/cantools$ cd ..
	~$ ctinit hello_world
	~$ cd hello_world/
	~/hello_world$ ctstart

And that's it. Open http://localhost:8080/ in your browser and call it a day.

# Back (CLI)

## ctinit
### Usage: ctinit [projname] [-ru] [--plugins=P1|P2|P3] [--cantools_path=PATH] [--web_backend=BACKEND]

### Options:
    -h, --help            show this help message and exit
    -p PLUGINS, --plugins=PLUGINS
                          which plugins would you like to use in your project?
    -c CANTOOLS_PATH, --cantools_path=CANTOOLS_PATH
                          where is cantools? (default: /guessed/path/from/__file__)
    -w WEB_BACKEND, --web_backend=WEB_BACKEND
                          web backend. options: dez, gae. (default: dez)
    -r, --refresh_symlinks
                          add symlinks to project and configure version control
                          path exclusion (if desired)
    -u, --update          update cantools and all managed plugins

NB: it may be necessary to specify --cantools_path. Normally, this is derived from
the __file__ property (the location of the ctinit script, init.py). However, if the
package lives in your Python dist-packages (as with 'easy_install', as well as
'setup.py install'), it does not contain the client-side files necessary for an
end-to-end web application, and these files therefore cannot be symlinked into your
new project. In these cases, indicate --cantools_path (the path to the cloned cantools
repository on your computer), and everything should work fine.

Generally speaking, one should clone the cantools github repository, 'setup.py install'
it (for the 'ct' commands), and then run 'setup.py develop', which will point 'cantools'
at your cloned cantools repo and keep the package up to date as you periodically 'git pull'
the latest version. Similarly, plugins should be kept in 'develop' mode, as they also will
generally have non-python files of consequence.

In most cases, the developer won't have to pay much attention to this stuff, because
initializing or refreshing a project will automatically install any necessary plugins
that aren't already present. Similarly, the --update flag pulls down the latest versions
of cantools and all managed plugins. Thus, plugins are dealt with under the hood without
any need for the developer to know or do anything beyond 'ctinit -r'.

## ctstart

### Usage: ctstart [--web_backend=BACKEND] [--port=PORT] [--datastore=DS_PATH]

### Options:
    -h, --help            show this help message and exit
    -w WEB_BACKEND, --web_backend=WEB_BACKEND
                          web backend. options: dez, gae. (default: dez)
    -p PORT, --port=PORT  select your port (default=8080)
    -a ADMIN_PORT, --admin_port=ADMIN_PORT
                          select your port (default=8002)
    -d DATASTORE, --datastore=DATASTORE
                          select your datastore file (default=sqlite:///data.db)

## ctdeploy
### Usage: ctdeploy [-d|s|p] [-un] [--js_path=PATH]

### Options:

    -h, --help            show this help message and exit
    -d, --dynamic         switch to dynamic (development) mode
    -s, --static          switch to static (debug) mode
    -p, --production      switch to production (garbled) mode
    -u, --upload          uploads project in specified mode and then switches
                          back to dynamic (development) mode
    -n, --no_build        skip compilation step
    -j JS_PATH, --js_path=JS_PATH
                          set javascript path (default=js)

### Supports 3 modes:
    - dynamic (files live in html)
      - normal development files
        - dynamic imports throughout
      - original files are loaded ad-hoc
        - chrome debugger plays nice
      - no wire encryption
      - all imports lazy
    - static (files live in html-static)
      - compiler builds same html files
        - script imports in head
        - otherwise unmodified source files
      - original files are directly referenced
        - chrome debugger prefers
      - no wire encryption
      - all hard requirements loaded in head
        - lazy-designated imports still lazy
    - production (files live in html-production)
      - all code is compiled in head
        - html is compressed
        - javascript is minified and mangled
      - original code is unrecognizable
        - chrome debugger almost useless
      - wire encryption
      - designated lazy imports (indicated by second bool arg to CT.require)

Generates fresh 'static' and 'production' files (from 'development' source files in 'html' on every run, unless -n [or --no_build] flag is used). Mode is established in the app.yaml file, which routes requests to the appropriate directory, and the ct.cfg file, which determines backend behavior, especially regarding encryption.

## ctpubsub
### Usage: ctpubsub [-d domain] [-p port]

### Options:
    -h, --help            show this help message and exit
    -d DOMAIN, --domain=DOMAIN
                        use a specific domain (default: localhost)
    -p PORT, --port=PORT  use a specific port (default: 8888)

## ctmigrate
### Usage: ctmigrate [load|dump] [--domain=DOMAIN] [--port=PORT] [--filename=FILENAME] [--skip=SKIP] [-n]

### Options:
	-h, --help            show this help message and exit
	-d DOMAIN, --domain=DOMAIN
	                      domain of target server (default: localhost)
	-p PORT, --port=PORT  port of target server (default: 8080)
	-f FILENAME, --filename=FILENAME
	                      name of sqlite data file for dumping/loading to/from
	                      (default: dump.db)
	-s SKIP, --skip=SKIP  don't dump these tables - use '|' as separator, such
	                      as 'table1|table2|table3' (default: none)
	-n, --no_binary       disable binary download

## ctindex
### Usage: ctindex [--mode=MODE] [--domain=DOMAIN] [--port=PORT] [--skip=SKIP]

### Options:
	-h, --help            show this help message and exit
	-m MODE, --mode=MODE  may be: 'refcount' (default - count up all foreignkey
	                      references for sort orders and such); 'index' (assign
	                      each record a sequential integer index); 'urlsafekeys'
	                      (update all key/keylist properties to use urlsafe keys
	                      introduced in ct 0.8); 'cleanup' (delete zero-count
	                      reference counters). Note regarding 'index' mode: it
	                      _must_ happen remotely; it's generally unnecessary
	                      unless you're trying to migrate an unindexed database
	                      away from gae and need an index/key per record; it
	                      should be invoked from _outside_ -- that's right,
	                      outside -- of your project's directory (to avoid
	                      loading up a bunch of google network tools that may be
	                      crappy or cause issues outside of their normal
	                      'dev_appserver' environment)
	-d DOMAIN, --domain=DOMAIN
	                      ('index' mode only) what's the domain of the target
	                      server? (default: localhost)
	-p PORT, --port=PORT  ('index' mode only) what's the port of the target
	                      server? (default: 8080)
	-s SKIP, --skip=SKIP  skip these tables ('index' mode only) - use '|' as
	                      separator, such as 'table1|table2|table3' (default:
	                      none)

As you can see, this script's behavior changes according to the backend of the target project.

### dez
Run this if your CTRefCount records get messed up for
some reason. It will go through and recount everything
(in the default 'refcount' mode -- the other modes,
'urlsafekeys' and 'cleanup', are for migrating a CT-mediated
database from an older deployment to CT 0.8 or newer).

### gae
Run this in 'index' mode on a database with lots of missing index values.

## ctdoc

### Usage: ctdoc [-w]

### Options:
    -h, --help  show this help message and exit
    -w, --web   build web docs

Run either from cantools root (contains setup.py, cantools/, README.md, etc) or
from root of plugin. In cantools, builds docs for all frontend (js) and CLI (py)
files. In plugin, docs consist of about file (about.txt), initialization config
(init.py) and default frontend config (js/config.js) (TODO: application mode,
which recursively includes any py/js file with a docstring at the top).

# Front (JS Library)

## CT.Drop
### Import line: 'CT.require("CT.Drop");'
This class makes a drop-down menu, and can be subclassed
into things like the CT.autocomplete classes.

## CT.Pager
### Import line: 'CT.require("CT.Pager");'
This class is used to generate a pager, which is a self-refilling DOM element.

### The constructor takes four positional arguments:
    - renderCb: function that returns formatted content given an array of data objects
    - requestCb: function that acquires new raw data
    - limit (default: 20): number of items to request/display at a time
    - nodeClass (optional): CSS class of pager DOM node
    - nodeId (optional): CSS id of pager DOM node

## CT.admin
### Import line: 'CT.require("CT.admin");'
This module includes submodules for interacting with the admin backend:

    - CT.admin.core
    - CT.admin.db
    - CT.admin.memcache
    - CT.admin.monitor
    - CT.admin.pubsub

## CT.align
### Import line: 'CT.require("CT.align");'
This module contains functions for determining
dimensions of and positioning DOM elements.

## CT.all
### Import line: 'CT.require("CT.all");'
This loader imports almost every CT module.

### This includes:
    - CT.Drop
    - CT.Pager
    - CT.align
    - CT.autocomplete
    - CT.canvas
    - CT.data
    - CT.db *
    - CT.drag
    - CT.dom
    - CT.file
    - CT.gesture
    - CT.key
    - CT.memcache *
    - CT.mobile
    - CT.modal
    - CT.panel
    - CT.parse
    - CT.pubsub *
    - CT.recaptcha
    - CT.slider
    - CT.storage
    - CT.trans
    - CT.upload
    - CT.video

* tightly coupled to backend

### This excludes:
    - CT.map, CT.pay, CT.rte, and CT.stream, which require large script imports
    - CT.admin, which is not for typical use.

## CT.autocomplete
### Import line: 'CT.require("CT.autocomplete");'
The purpose of this module is to simplify the creation of DOM
text fields that autocomplete user input based on some data set.

This module contains two classes, Guesser and DBGuesser.

### CT.autocomplete.Guesser

Guesser is a subclass of CT.Drop.

#### The constructor takes an options object with any or all of the following properties:
    - enterCb (default: doNothing): trigger when user hits enter
    - keyUpCb (default: doNothing): trigger on key up
    - expandCB (default: doNothing): trigger when autocomplete node expands
    - tapCb (default: set input to data.label): trigger on option tap
    - guessCb (default: this.guesser): trigger when it's time to guess
    - input (required): the input node to which to attach the autocomplete guesser
    - data (default: []): array of label-containing objects used by default guesser

To specify custom guessing behavior, either pass in a 'guessCb' function to the
constructor or subclass Guesser, adding this function to the class (as 'guesser').

### CT.autocomplete.DBGuesser
DBGuesser subclasses Guesser, and defines a 'guesser'
function, which uses the CT.db module to acquire data.

#### DBGuesser's constructor supports a few more properties:
    - modelName: the name of the backend database model to query from
    - property: the property (on specified model) to compare to text input
    - filters (default: {}): filters to apply to database query

## CT.canvas
### Import line: 'CT.require("CT.canvas");'
This module contains classes that simplify use of the HTML5 canvas element:

    - CT.canvas.Canvas
    - CT.canvas.Controller
    - CT.canvas.Node
    - CT.canvas.Text

## CT.ct
### Import line: '&lt;script src="/js/CT/ct.js"&gt;&lt;/script&gt;'
This is the cantools bootstrapper. This means that it must be included in
a regular script tag in the head of your html file. It contains the core
functionality of the framework, as follows.

### CT.net
#### This is where the network stuff lives. Highlights:
	- CT.net.post(path, params, errMsg, cb, eb, headers, cbarg, ebarg)
	  - issues a POST request via asynchronous XHR
	- CT.net.get(path, qsp, isjson, ctjson)
	  - issues a GET request via synchronous XHR
	  - optionally parses query string object and unpacks response as JSON
	- CT.net.put(path, params, cb, headers)
	  - issues a PUT request via asynchronous XHR
	- CT.net.delete(path, params, cb, headers)
	  - issues a DELETE request via asynchronous XHR

#### Also includes:
	- CT.net.setMode(string) (default: 'ct')
	  - also supports:
	    - 'basic', which skips request prepping and response code processing
	    - 'passthrough', which does nothing (doesn't even JSON stringify)
	- CT.net.setSpinner(bool) (default: false)
	  - enables/disables spinner (indicating outstanding request)
	- CT.net.setCache(bool) (default: false)
	  - enables/disables client-side request caching
	- CT.net.setSilentFail(bool) (default: true)
	  - enables/disables alert-level error reporting (if otherwise undefined)
	- CT.net.setEncoder(func)
	  - sets encoder (upstream data processing function)
	  - must be used in conjunction with cantools.web.setenc()
	- CT.net.setDecoder(func)
	  - sets decoder (downstream data processing function)
	  - must be used in conjunction with cantools.web.setdec()
	- CT.net.xhr(path, method, params, async, cb, headers)
	  - thin wrapper around browser-level XHR abstraction

### CT.require(modname, lazy)
This is the basis of the cantools module system. Any time your code requires
a module (CT or otherwise), simply call CT.require('MyProject.submodule.whatever')
to dynamically pull in the necessary code. When your project is compiled in
production mode, these imports are baked into the host HTML file, _except_
those flagged 'lazy' (second argument is 'true').

### CT.scriptImport(modpath, cb, delay)
This function supports the importation of libraries that only work if they
know their path (which they ascertain by checking their own script tag).
This includes many popular libraries, such as TinyMCE and Google Maps.

### CT.onload(cb)
Registers a callback to be fired when the window loads.

### CT.merge()
Merges arbitrary number of objects into new object and returns result.

### CT.Class(obj, parent)
This function creates a cantools class. The first argument is a class
definition, an object containing all the functions and properties
belonging to the class. The second (optional) argument is the base
class from which to inherit.

If the class definition includes a 'CLASSNAME' property, this is used
for logging (each class instance has its own 'log' function). Otherwise,
a warning is generated.

If the class definition includes an 'init' function, this function
becomes the class constructor, which is called when an instance is
created (var instance_of_ClassA = new ClassA([args])).

All class functions are bound to the instance, including those
embedded in data structures.

### CT.log
This module contains functions for logging, acquiring specific loggers,
and filtering log output, as well as timing functions for profiling code.

### shims
In addition to the above functions and modules, the cantools bootstrapper provides a
number of shims - fallback implementations of key functionality - for old browsers.
These are required lazily, meaning that they are _not_ included in production-compiled
code, and they're only imported as needed (when missing from browser).

#### These include:
	- JSON
	- sessionStorage
	- classList
	- requestAnimationFrame
	- Object.values
	- addEventListener

## CT.data
### Import line: 'CT.require("CT.data");'
This module contains functions for:

    - structure comparison
    - array manipulation
    - object caching
    - data acquisition

## CT.db
### Import line: 'CT.require("CT.db");'
This module provides direct integration with the cantools.db backend
via the _db.py request handler. Some key functions are defined below.

### CT.db.getSchema(modelName)
Return the schema for the named model.

### CT.db.setSchema(schema)
Sets CT.db._schema, which includes every model in the database. This is
called automatically by CT.db.init(), which acquires it from the backend.

### CT.db.get(modelName, cb, limit (default: 20), offset (default: 0), order, filters)
Acquire the data set defined by the given query parameters, add
it to CT.data's map, and pass it back via callback function (cb).

### CT.db.multi(keys, cb)
Acquire data objects corresponding to members of 'keys' array, add
them to CT.data's map, and pass them back via callback function (cb).

### CT.db.one(key, cb)
Acquire data object corresponding to 'key' string, add it to
CT.data's map, and pass it back via callback function (cb).

### CT.db.init(opts)
Acquire and set the database schema. Establish CT.db._opts object used by
UI elements for querying database and adding/editing records. These include:

    - builder (required):
      - this generator function, given a modelName, returns a render callback
        for internal use with CT.panel.pager().
    - panel_key (default: 'db'):
      - this optional string argument may be used to indicate the desired parent
        node of a pager element (generated by CT.db.pager()).
    - post_pager (optional):
      - this function is called whenever a pager is generated via CT.db.pager().

### CT.db.query(opts, transition)
This function generates a modal (CT.modal.Modal) containing a query node
(CT.db.Query) constructed with opts. The modal appears onscreen with the
indicated transition (defaults to 'none').

### CT.db.pager(modelName, order, filters, k, cnode)
This function creates a pager node (CT.Pager [via CT.panel.pager()] refilled
via CT.db.get() used in conjunction with modelName, order, filters). It then
adds this node to a parent indicated by cnode or (if undefined) determined by
k (which falls back to modelName) and panel_key (set by CT.db.init(), defaults
to 'db'). Finally, if a 'post_pager' callback has already been defined by
CT.db.init(), this callback is invoked, passing in key and modelName.

### CT.db.edit (submodule)
This submodule contains functions for building interface elements that
enable direct creation and modification of database records. This includes
the CT.db.edit.EntityRow class, of which such interfaces primarily consist.

### CT.db.Query (class)
This class (often used in conjunction with CT.modal.Modal) builds a DOM node
containing the interface elements necessary to define a query against the specified
table. The constructor takes an options object ('opts') with three possible entries:

    - showHelp: indicates whether or not to show help strings in the query node
      - default: false
    - pagerPanelId: specifies parent node for pager generated by default submit
      - default: 'dbqueries'
    - submit: the function to call when the 'submit' button is clicked
      - default: pager node is created and added to parent indicated by pagerPanelId

## CT.dom
### Import line: 'CT.require("CT.dom");'
This module contains functions for interacting with the DOM. This includes:

### simple and compound node creation
#### CT.dom.node(content, type, classname, id, attrs, style)
	- content - what goes in the resulting DOM node. may be:
	  - a node
	  - a function
	  - an object
	  - a string or number
	  - an array containing any of the above
	- type - tag name of resulting DOM node
	- classname - class of resulting DOM node
	- id - id of resulting DOM node
	- attrs - object defining miscellaneous properties of resulting DOM node
	- style - object mapping CSS properties to values

All other node generators use CT.dom.node() under the hood. There are many. See code.

### selectors
#### CT.dom.id(id, all)
	- 'all' is a bool indicating whether to also search free-floating nodes.
#### CT.dom.className(cname, n)
	- 'n' is the node to search. defaults to document.
#### CT.dom.tag(tag, n)
	- 'n' is the node to search. defaults to document.
#### CT.dom.Q(q, n)
	- executes querySelectorAll(q) on n (defaults to document)

### style modding
#### CT.dom.mod(opts)
	- 'opts' object must include:
	  - property: CSS property to modify
	  - value: new value
	- 'opts' object must include one of:
	  - target (node)
	  - targets (node array)
	  - className (string)
	  - id (string)
#### CT.dom.addStyle(text, href, obj)
	- use EITHER text, href, or obj
	  - text: raw CSS text
	  - href: url of stylesheet
	  - obj: object mapping selector strings to style definitions (specified
			 via embedded objects mapping CSS properties to values)

## CT.drag
### Import line: 'CT.require("CT.drag");'
This module enables cross-platform, sometimes-native dragging, mostly via
CT.gesture module. The principle function is makeDraggable(), used as follows:

### CT.drag.makeDraggable(node, opts)
This function makes the 'node' node draggable. The 'opts' object may contain
any or all of the following options:

    - constraint ('horizontal' or 'vertical'): prevents drags in indicated direction.
    - interval (number): 'chunks' total drag area into sections, causing drags to
                         always settle on areas corresponding to multiples of 'interval',
                         and swipes to slide between such areas. if value is 'auto',
                         we use width / number_of_child_nodes.
    - force (bool, default false): forces non-native scrolling.
    - up, down, drag, scroll, swipe (functions): optional gesture callbacks.

## CT.file
### Import line: 'CT.require("CT.file");'
This module provides functions and a class (CT.file.File) for
messing with (accessing, uploading, downloading) file objects.

## CT.gesture
### Import line: 'CT.require("CT.gesture");'
This module contains functions for registering cross-platform gesture callbacks.
The main one to look out for is listen, defined below.

### CT.gesture.listen(eventName, node, cb, stopPropagation, preventDefault)
    - eventName - one of: drag, swipe, tap, up, down, hold, pinch, hover, wheel
    - node - the node to listen to
    - cb - the function to call when something happens
    - stopPropagation - whether to propagate this event beyond node
    - preventDefault - whether to prevent default behavior

## CT.key
### Import line: 'CT.require("CT.key");'
This module supports global key bindings.

## CT.layout
### Import line: 'CT.require("CT.layout");'
This module provides functions that generate common UI elements. These include:

### header(opts) - defaults:
	logo: "Placeholder Logo"
	right: []
	rightPadding: "30px" // non-centerLogo only!
	centerLogo: true

### footer(opts) - defaults:
	logo: "Placeholder Logo"
	links: []
	contact: {}

### grid(data, columns, rows, hardheight) - defaults:
	columns: 3
	rows: 4

### profile(opts) - defaults:
	className: "w2-3 h1 noflow abs"
	buttons: []

### listView(opts) - defaults:
	parent: "ctmain"
	listClass: "ctlist big"
	contentClass: "ctcontent"
	titleClass: "biggerest bold bottompadded"
	content: null
	listNode: null
	listContent: null
	activeClass: null
	fallback: null
	hashcheck: null


## CT.map
### Import line: 'CT.require("CT.map");'
This module loads the Google Maps API via CT.scriptImport(),
as well as a utility submodule (CT.map.util) and four classes:

    - CT.map.Map
    - CT.map.Node
    - CT.map.Marker
    - CT.map.Shape

## CT.memcache
### Import line: 'CT.require("CT.memcache");'
This module provides direct integration with the cantools memcache service via
the _memcache.py request handler. Some key functions are defined below.

### CT.memcache.get(key, cb, localCache)
Return the (server-side) value for the specified key.

### CT.memcache.set(key, val, cb, localCache)
Instruct the server to remember the specified key and value.

## CT.mobile
### Import line: 'CT.require("CT.mobile");'
This module takes a website formatted for a regular computer screen
and, via configuration, mobilizes it by zooming in on specific sections
of the page and providing user interface elements for scaling/translating
between components.

## CT.modal
### Import line: 'CT.require("CT.modal");'
This module contains three classes, Modal, LightBox, and Prompt.

### CT.modal.Modal
Creates a DOM node that can be transitioned
on- and off- screen to/from a configurable position.

defaults:
	{
		className: "basicpopup",
		innerClass: "h1 w1 scroller",
		transition: "none", // none|fade|slide
		center: true,
		noClose: false, // turns off 'x' in corner
		slide: { // only applies if transition is 'slide'
			origin: "top"
		}
	}

Note that the optional 'slide' object -- which only applies when
transition is 'slide' -- may include 'top', 'left', 'bottom', and 'right'
properties. For any other transition (when center is false), please
position your node via css class (specified via 'className' property).

### CT.modal.LightBox (Modal subclass)
Centered, almost-fullscreen, fade-in, image-backed modal with translucent backdrop.

defaults:
	{
		className: "backdrop",
		transition: "fade",
		caption: "",
		noClose: true
	}


### CT.modal.Prompt (Modal subclass)
Includes interface elements for obtaining user input, such as
a string, a password, or one or more selections from a list.

defaults:
	{
		style: "string", // string|password|single-choice|multiple-choice|file
		prompt: "",
		data: [] // only applies to choice styles
	}

## CT.panel
### Import line: 'CT.require("CT.panel");'
This module contains functions for generating lists of items that,
when clicked, show corresponding content or trigger corresponding
logic. Here are three examples.

### CT.panel.simple(pnames, keystring, itemnode, panelnode, cbs)
This function wraps CT.panel.load(), supporting a subset of load()'s
options (the simple ones). It supports the following args, of which
only the first is required:

    - pnames (string array): short for 'panel names'
    - keystring (string, default: 'sb'): identifier for collections of content/lister nodes
    - itemnode (node, default: CT.dom.id(keystring + "items")): parent node for lister items
    - panelnode (node, default: CT.dom.id(keystring + "panels")): parent node for content panels
    - cbs (function array, optional): callbacks to invoke on lister item click post- panel swap

### CT.panel.pager(getContent, request, limit, colClass, dataClass, ks)
This function generates and returns a node containing a
(CT.Pager-backed) paging lister node and a corresponding content panel.

    - getContent (function): combined with CT.panel.simple() in pager's renderCb
    - request (function): pager's requestCb
    - limit (number, default: 20): pager's limit (chunk size)
    - colClass (string, optional): class of generated pager (list selector) node
    - dataClass (string, optional): class of generated data (content panel) node
    - ks (string, default: "p" + CT.Pager._id): keystring of data and list nodes

### CT.panel.triggerList(data, cb, node)
This function fills the 'node' node with a list of clickable items, each of
which triggers cb(d), where d is the corresponding object in the 'data' array.

    - data (object array): data set used to generate list
      - for d in data: link content equals d.label || d.title
    - cb (function): the callback to invoke when an item is clicked
    - node (node): the list parent node

## CT.parse
### Import line: 'CT.require("CT.parse");'
This module contains functions for manipulating and processing text. This includes:

### parsing
Mainly, you'll just want to call CT.parse.process(c, simple, customArg).

#### It returns the processed string and supports 3 positional arguments:
    - c (string)
      - the text to process
    - simple (bool)
      - if true, uses simple link wrapping
      - else (default), embeds images and invokes custom processor (if any)
    - customArg (anything)
      - passed to custom link processor, if any (for indicating some mode, for instance)

#### Furthermore:
    - normalizes whitespace
    - formats and embeds links for phone numbers
    - generates mailto links as necessary
    - processes remaining links via url2link() or processLink() (switching on simple)

### link processing
This is done through CT.parse.processLink(url, customArg).

#### It supports two arguments:
    - url: url to parse
    - customArg: passed to custom processor, for instance, for disabling embedded video

#### Furthermore:
    - embeds images
    - linkifies other links
    - adds 0-width whitespace characters to line-break url strings as necessary
      - via CT.parse.breakurl(url)
    - supports custom link processing callbacks
      - via CT.parse.setLinkProcessor(cb)

### input constraints/validation
	CT.parse.validEmail(s): returns bool
	CT.parse.validPassword(s): returns bool
	CT.parse.numOnly(n, allowDot, noNeg): returns n
	 - turn 'n' input into a field that only allows numbers
	 - allowDot and noNeg toggle decimals and negative #s

### strippers, formatters, converters, sanitization
Various functions for deriving different types of information, such as
phone numbers and zip codes, from text; reformatting recognizable strings
and generating links (as in the case of phone numbers); case-modding,
soft-truncating, and removing script blocks from text; and otherwise messing
with strings. Also, CT.parse.timeStamp(datetime) goes a long way toward
making timestamps meaningful to humans.

## CT.pay
### Import line: 'CT.require("CT.pay");'
This module contains a class, CT.pay.Form, that, in conjunction
with a tightly-coupled backend component (_pay.py), provide
integration with the Braintree payment platform, which supports:

	- PayPal
	- Credit Cards
	- Venmo
	- Apple Pay
	- Android Pay
	- Bitcoin?

## CT.pubsub
### Import line: 'CT.require("CT.pubsub");'
This module provides a direct interface with the ctpubsub backend. Here's how to use it.

	CT.pubsub.connect(host, port, uname)
	CT.pubsub.publish(channel, message)
	CT.pubsub.subscribe(channel)
	CT.pubsub.unsubscribe(channel)
	CT.pubsub.pm(user, message)
	CT.pubsub.set_cb(action, cb)
	CT.pubsub.set_reconnect(bool)
	CT.pubsub.isInitialized() (returns bool)

## CT.recaptcha
### Import line: 'CT.require("CT.recaptcha");'
This module provides functions, build() and submit(),
for messing around with recaptcha botwalls.

TODO: this functionality requires backend
integration - include complementary python module!

## CT.rte
### Import line: 'CT.require("CT.rte");'
This module provides two functions, wysiwygize() and qwiz(), which
both convert textareas (identified by id) into rich text editors.

### CT.rte.wysiwygize(nodeid, isrestricted, val, cb, mismatchcb)
	- nodeid: id of target textarea (must exist in DOM)
	- isrestricted: if true, disables tables and images
	- val: string value with which to initialize target text area
	- cb: callback to invoke once textarea is initialized
	- mismatchcb: callback to invoke if the reformatted text doesn't match val
### CT.rte.qwiz(nodeid, val)
	- nodeid: id of target textarea (must exist in DOM)
	- val: string value with which to initialize target text area

CT.rte.qwiz() just builds a simplified (isrestricted=true) rich text area
after first waiting for the nodeid-indicated node to appear in the DOM.

CT.rte requires the open-source TinyMCE library, pulled in via CT.scriptImport().

## CT.slider
### Import line: 'CT.require("CT.slider");'
This class is used to generate a slider, which is a segmented,
directionally-constrained draggable DOM element.

The CT.slider.Slider constructor takes an options object, 'opts', which may
define any of several properties. These individual properties, as well as
the 'opts' object itself, are all optional.

### Definable properties are as follows:
    - parent (default: document.body): DOM element in which to build the slider
    - mode (default: 'peekaboo'): how to display each frame - 'peekaboo', 'chunk', 'menu', 'profile', or 'track'
    - subMode (default: 'peekaboo'): which mode to use for chunk-mode frames ('peekaboo', 'menu', 'profile', 'track')
    - defaultImg (default: undefined): fallback img for any frame mode
    - img (default: undefined): panning background image for whole slider. also works per-chunk.
    - arrow (default: null): image for pointer arrow (falls back to pointy brackets)
    - autoSlideInterval (default: 5000): how many milliseconds to wait before auto-sliding frames
    - panDuration (default: autoSlideInterval): pan duration for background images
    - autoSlide (default: true): automatically proceed through frames (else, trigger later with .resume())
    - visible (default: true): maps to visibility css property
    - navButtons (default: true): include nav bubbles and arrows
    - circular (default: false): allow shifting between 1st and last frames w/ nav buttons (arrows)
    - pan (default: true): slow-pan frame background images
    - translucentTeaser (default: true): translucent box around teaser text (otherwise opaque)
    - startFrame (default: null): label (or index if frames are unlabeled) of frame to slide to initially (disables autoSlide)
    - bubblePosition (default: 'bottom'): where to position frame indicator bubbles ('top' or 'bottom')
    - arrowPosition (default: 'middle'): where to position navigator arrows
    - orientation (default: 'horizontal'): orientation for slider frames to arrange themselves
    - keys (default: true): use arrow keys to navigate slider, as well as enter key for peekaboo transitions
    - frames (default: []): an array of items corresponding to the frames in the slider

The last one, 'frames', must be an array either of strings (interpreted
as image urls) or of data objects (processed in the addFrame function).

## CT.storage
### Import line: 'CT.require("CT.storage");'
This module provides an abstraction layer over a storage backend.

### Here are the obvious functions:
    - CT.storage.get(key)
    - CT.storage.set(key, val)
    - CT.storage.clear()

### You also have to call CT.storage.init(opts). The 'opts' object may contain:
    - backend (one of: localStorage, sessionStorage) - default: localStorage
    - json (bool) - default: true
    - compress (bool) - default: true

Why call init(), you ask? Well, if 'compress' is true, the storage module
needs to lazily import CT.lib.lz-string. Could be different, but there it is.

## CT.stream
### Import line: 'CT.require("CT.stream");'
This module provides functions and classes for streaming video all over town.

Highlights include:

### CT.stream.record(ondata, onrecorder, onfail)
Starts up a video stream from your webcam. Breaks stream into segments as
defined by CT.stream.opts.chunk (default 3000) and CT.stream.opts.segments
(default 10).

### CT.stream.Multiplexer
Uses WebSocket pubsub server (ctpubsub/CT.pubsub) to manage multiple channels,
each streaming metadata pertaining to multiple videos, over a single connection.
The video segments are acquired from the server with the CT.memcache module
and passed to individual CT.stream.Video instances.

### CT.stream.Video
Wraps an HTML5 video tag in a class with functions for streaming a video
that arrives in chunks.

## CT.trans
### Import line: 'CT.require("CT.trans");'
This module provides convenience functions for messing
around with DOM elements via CSS transitions. Have at it.

### Try out these functions:
	CT.trans.rotate(node, opts)
	CT.trans.translate(node, opts)
	CT.trans.wobble(node, opts)
	CT.trans.pan(node, opts, wait)
	CT.trans.resize(node, opts)
	CT.trans.fadeIn(node, opts)
	CT.trans.fadeOut(node, opts)
	CT.trans.pulse(node, opts)
	CT.trans.trans(opts)
	CT.trans.setVendorPrefixed(node, property, value)
	 - sets CSS properties for all vendor prefixes
	   - [ "-webkit-", "-moz-", "-ms-", "-o-", "" ]

### And here are the default options:
	trans: {
		duration: 500,
		property: "*",
		ease: "ease-in-out"
	},
	rotate: {
		degrees: 180,
		duration: 1000,
		property: "transform",
		ease: "linear",
		prefix: true
	},
	translate: {
		duration: 300,
		property: "transform",
		ease: "linear",
		prefix: true,
		x: 0,
		y: 0,
		z: 0
	},
	wobble: {
		axis: "x",
		radius: 50,
		duration: 100
	},
	pan: {
		duration: 5000,
		ease: "linear",
		x: 0,
		y: 0
	},
	resize: {
		duration: 300,
		ease: "linear"
	},
	fadeIn: {
		duration: 1600,
		property: "opacity",
		value: 1
	},
	fadeOut: {
		duration: 1600,
		property: "opacity",
		value: 0
	},
	pulse: {
		wait: 1000
	},
	invert: {
		direction: "horizontal", // or vertical
		property: "transform",
		prefix: true
	}

TODO: let's add some more, like scale.

Certain functions (pan() and pulse()) return a CT.trans.Controller instance.

### CT.trans.Controller
	pause()  - stop the transition (for now)
	resume() - resume the transition
	active() - returns status of transition (bool)
	tick()   - calls cb() if active()
	init(cb) - cb() is called by tick() if active()

## CT.upload
### Import line: 'CT.require("CT.upload");'
This module supports file uploads.

### CT.upload.form(uid, kval, sbutton, isize)
	- uid: user id (if any)
	- kval: upload key (if any)
	- sbutton: submit button (if any)
	- isize: input size (in characters)

### CT.upload.submit(f, success, failure, iskey)
	- f: input field
	- success: upload success callback
	- failure: upload failure callback
	- iskey: whether a key is expected as the return value

This module lazily imports CT.lib.aim (in submit()).

TODO: remove/replace uid/kval/iskey -- too application-specific

## CT.video
### Import line: 'CT.require("CT.video");'
This module supports video playback.

### video players
We support Google Video, YouTube, Vimeo, and uStream.

### raw formats
We support mp4, ogg, and webm.

Typically, you'll want to use the fit() function.

### CT.video.fit(video)
	- returns stringified html for a video node fitting snugly inside its parent