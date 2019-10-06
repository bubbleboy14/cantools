/*
This module contains a class, Cal, for calendar-based applications. Usage:

	CT.dom.setBody((new CT.cal.Cal()).node);
*/

CT.cal = {
	days: ["Sunday", "Monday", "Tuesday", "Wednesday",
		"Thursday", "Friday", "Saturday"],
	months: ["January", "February", "March", "April",
		"May", "June", "July", "August", "September",
		"October", "November", "December"]
};

CT.cal.Cal = CT.Class({
	CLASSNAME: "CT.cal.Cal",
	_: {
		shift: function(diff) {
			this.opts.now.setMonth(this.opts.now.getMonth() + diff);
			this.orient();
		}
	},
	days: function() {
		var _ = this._, dayz = CT.cal.days.slice(),
			i, now = this.opts.now, today = now.getDate(),
			year = now.getFullYear(), month = now.getMonth(),
			first = new Date(year, month),
			last = new Date(year, month + 1, 0),
			offset = first.getDay(),
			lastday = last.getDate(),
			prevlast = new Date(year, month, 0).getDate();

		for (i = offset - 1; i > -1; i--)
			dayz.push(CT.dom.div(prevlast - i, "other"));

		for (i = 1; i <= lastday; i++)
			dayz.push(CT.dom.div(i, (i == today) && "today"));

		i = 0;
		while (dayz.length % 7)
			dayz.push(CT.dom.div(++i, "other"));
		return dayz;
	},
	month: function() {
		var _ = this._, shift = _.shift, now = this.opts.now;
		return CT.dom.div([
			CT.dom.button("previous", function() { shift(-1); }),
			CT.dom.span(CT.cal.months[now.getMonth()] + " " + now.getFullYear(),
				"biggerest bold"),
			CT.dom.button("next", function() { shift(1); })
		], "centered");
	},
	orient: function() {
		this.node = this.node || CT.dom.div(null, "cal");
		CT.dom.setContent(this.node, [
			CT.dom.div(this.month(), "month"),
			CT.dom.div(this.days(), "days")
		]);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			now: new Date()
		});
		this.orient();
	}
});