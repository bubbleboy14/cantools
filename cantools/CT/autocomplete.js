/*
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
*/

CT.autocomplete.Guesser = CT.Class({
	CLASSNAME: "CT.autocomplete.Guesser",
	targets: [],
	_doNothing: function() {},
	_returnTrue: function() { return true; },
	tapTag: function(data) {
		this.opts.tapCb(data);
	    this.retract();
	},
	addTag: function(data) {
		var n = CT.dom.node(data.label, "div", "tagline", "ac" + data.label.replace(/ /g, ""));
		data.label.toLowerCase().split(" ").forEach(function(word) {
			for (var i = 1; i <= word.length; i++)
				n.className += " " + word.slice(0, i);
		});
		this.node.firstChild.appendChild(n);
		this.targets.push(n);
		n.onclick = function() {
			this.tapTag(data);
		}.bind(this);
	},
	guesser: function(frag) {
		this._update(this.opts.data.filter(function(d) {
			return d.label.slice(0, frag.length) == frag;
		}));
	},
	_hide: function() {
		this.node.className = "drop hider";
		this.input.blur();
	},
	_upOne: function(d) {
		if (!CT.dom.id("ac" + d.label.replace(/ /g, "")))
			this.addTag(d);
	},
	_update: function(data) {
		data.forEach(this._upOne);
	},
	_onUp: function(e) {
		if (!this.viewing) {
			this.opts.expandCb();
			CT.dom.mod({
				className: "tagline",
				show: true
			});
			this.expand(function() {
				this.input.active = true;
				this.input.focus();
			}.bind(this));
			return true;
		}
	},
	_unselect: function() {
		if (this.selection) {
			this.selection.classList.remove("drop-selection");
			this.selection = null;
		}
	},
	_select: function(godown) { // else go up
		if (this.targets.length) {
			var index = this.targets.indexOf(this.selection);
			index += godown ? 1 : -1;
			if (index < 0)
				index = this.targets.length - 1;
			else if (index >= this.targets.length)
				index = 0;
			this._unselect();
			this.selection = this.targets[index];
			this.selection.classList.add("drop-selection");
			this.selection.scrollIntoViewIfNeeded();
		}
	},
	_onKeyUp: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which;
		if (code == 27)
			return this._retract();
		if (code == 38 || code == 40)
			this._select(code == 40);
		else if (code == 13 || code == 3) {
			if (this.selection) {
				this.selection.onclick();
				this._unselect();
				this.targets.length = 0;
			} else {
				this.input.blur();
				this.opts.enterCb(this.input.value);
			}
		} else if (this.input.value) {
			var tagfrag = this.input.value.toLowerCase();
			this.targets = CT.dom.className(tagfrag, this.node);
			this._unselect();
			CT.dom.mod({
				className: "tagline",
				hide: true
			});
			if (this.targets.length)
				CT.dom.mod({
					className: tagfrag,
					show: true
				});
			else
				this.opts.guessCb(tagfrag, this._update);
			if (!this.viewing)
				this.expand();
		} else CT.dom.mod({
			className: "tagline",
			hide: true
		});
		this.opts.keyUpCb();
	},
	_onTap: function(data) {
		this.input.value = data.label;
		this.input.onenter && this.input.onenter();
	},
	_focus: function() {
		this.input.focus();
	},
	_retract: function() {
		this._unselect();
		this.targets.length = 0;
		this.retract();
		setTimeout(this._focus, 500);
	},
	_waitRetract: function() {
		this._unselect();
		this.targets.length = 0;
		setTimeout(this.retract, 500);
	},
	init: function(opts) {
		opts = this.opts = CT.merge(opts, {
			enterCb: this._doNothing,
			keyUpCb: this._doNothing,
			expandCb: this._doNothing,
			tapCb: this._onTap,
			guessCb: this.guesser,
			anchor: opts.input,
			data: []
		});
		opts.data = opts.data.map(function(d) {
			return typeof d == "string" ? { label: d } : d;
		});
		CT.autocomplete.Guesser.id += 1;
		this.id = CT.autocomplete.Guesser.id;
		this.input = opts.input;
		CT.gesture.listen("down", this.input, this._returnTrue);
		CT.gesture.listen("up", this.input, this._onUp);
		this.input.addEventListener("keyup", this._onKeyUp);
		this.input.addEventListener("blur", this._waitRetract);
	}
}, CT.Drop);
CT.autocomplete.Guesser.id = 0;

CT.autocomplete.DBGuesser = CT.Class({
	CLASSNAME: "CT.autocomplete.DBGuesser",
	guesser: function(frag) {
		var filters = CT.merge(this.opts.filters);
		filters[this.opts.property] = {
			comparator: "like",
			value: frag + "%"
		};
		CT.db.get(this.opts.modelName, this._update, null, null, null, filters);
	}
}, CT.autocomplete.Guesser);