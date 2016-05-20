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
    - tapCb (default: set input to data[data.label]): trigger on option tap
    - guessCb (default: this.guesser): trigger when it's time to guess
    - input (required): the input node to which to attach the autocomplete guesser

You might notice that no 'guesser' function is defined on this class.
This means that you must either pass in a 'guessCb' function to the constructor
or subclass Guesser, adding this function to the class (as 'guesser').

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
	_doNothing: function() {},
	_returnTrue: function() { return true; },
	tapTag: function(data) {
		this.opts.tapCb(data);
	    this.retract();
	},
	addTag: function(data) {
		var tagName = data[data.label];
		var n = CT.dom.node(tagName, "div", "tagline", "ac" + tagName);
		var tlower = tagName.toLowerCase();
		for (var i = 1; i <= tlower.length; i++)
			n.className += " " + tlower.slice(0, i);
		this.node.firstChild.appendChild(n);
		n.onclick = function() {
			this.tapTag(data);
		}.bind(this);
	},
	_hide: function() {
		this.node.className = "drop hider";
		this.input.blur();
	},
	_upOne: function(d) {
		if (!CT.dom.id("ac" + d[d.label]))
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
	_onKeyUp: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which;
		if (code == 13 || code == 3) {
			this.input.blur();
			this.opts.enterCb(this.input.value);
		} else if (this.input.value) {
			var tagfrag = this.input.value.toLowerCase(),
				targets = CT.dom.className(tagfrag, this.node);
			CT.dom.mod({
				className: "tagline",
				hide: true
			});
			if (targets.length)
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
		this.input.value = data[data.label];
	},
	_waitRetract: function() {
		setTimeout(this.retract, 500);
	},
	init: function(opts) {
		opts = this.opts = CT.merge(opts, {
			enterCb: this._doNothing,
			keyUpCb: this._doNothing,
			expandCb: this._doNothing,
			tapCb: this._onTap,
			guessCb: this.guesser
		});
		CT.autocomplete.Guesser.id += 1;
		this.id = CT.autocomplete.Guesser.id;
		this.input = this.anchor = opts.input;
		CT.gesture.listen("down", this.input, this._returnTrue);
		CT.gesture.listen("up", this.input, this._onUp);
		this.input.onkeyup = this._onKeyUp;
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