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
		},
		appointments: {
			daily: [],
			weekly: CT.cal.days.map(function(d) { return []; }),
			once: CT.cal.months.map(function(m) { return {}; }),
			exception: CT.cal.months.map(function(m) { return {}; })
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
			prevlast = new Date(year, month, 0).getDate(),
			appz = this._.appointments;

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
	appointments: function() {
		var appz = this._.appointments,
			months = CT.cal.months;
		this.opts.appointments.forEach(function(task) {
			// TODO: change to CT.db.multi(...)
			task.timeslots.forEach(function(tslot) {
				tslot.task = task;
				tslot.when = new Date(tslot.when);
				var month = tslot.when.getMonth(),
					date = tslot.when.getDate(),
					day = tslot.when.getDay();
				if (tslot.schedule == "daily")
					appz.daily.push(tslot);
				else if (tslot.schedule == "weekly")
					appz.weekly[day].push(tslot);
				else
					appz[tslot.schedule][month][date] = tslot;
			});
		});
	},
	orient: function() {
		CT.dom.setContent(this.node, [
			CT.dom.div(this.month(), "month"),
			CT.dom.div(this.days(), "days")
		]);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			now: new Date(),
			appointments: []
		});
		this.node = CT.dom.div(null, "cal");
		this.node.cal = this;
		this.appointments();
		this.orient();
	}
});