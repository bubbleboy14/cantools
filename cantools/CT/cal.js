/*
This module contains a class, Cal, for calendar-based applications. Usage:

	CT.dom.setBody((new CT.cal.Cal({
		timeslots: "data", // or "key" (the default, for use w/ databases)
		appointments: [{
			name: "app 1",
			description: "the first appointment",
			timeslots: [{
				schedule: "once",
				when: "Thu Oct 10 2019 14:15",
				duration: 1
			}, {
				schedule: "weekly",
				when: "Wed Oct 09 2019 18:45",
				duration: 2
			}]
		}, {
			name: "lunch",
			description: "when we eat food",
			timeslots: [{
				schedule: "daily",
				when: "Mon Oct 07 2019 12:00",
				duration: 1
			}]
		}, {
			name: "number D",
			description: "another one, blah blah bloo",
			timeslots: [{
				schedule: "weekly",
				when: "Fri Oct 04 2019 15:00",
				duration: 1
			}, {
				schedule: "exception",
				when: "Fri Oct 11 2019 18:45",
				duration: 2
			}]
		}]
	})).node);
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
	day: function(date, month, year) {
		var appz = this._.appointments,
			day = new Date(year, month, date).getDay(),
			slots = appz.daily.slice().concat(appz.weekly[day].slice()),
			oncers = appz.once[month][date] || {}, tname;

		for (tname in oncers)
			slots = slots.concat(oncers[tname]);

		slots.sort(function(a, b) {
			return a.when.toTimeString() - b.when.toTimeString();
		});

		return CT.dom.div([
			CT.dom.div(date, "right"),
			CT.dom.div(slots.filter(function(slot) {
				// TODO: improve this filter
				var moda = appz.exception[month][date];
				return !(moda && (slot.task.name in moda));
			}).map(function(slot) {
				return CT.dom.div(slot.when.toTimeString().slice(0, 5) + " " + slot.task.name,
					"appointment", null, {
						onclick: function() {
							(new CT.modal.Modal({
								transition: "slide",
								content: [
									CT.dom.div(slot.task.name, "bigger"),
									slot.task.description,
									slot.duration + " hours"
								]
							})).show();
						}
					});
			}), "abs all0")
		], (date == this.opts.now.getDate()) && "today");
	},
	days: function() {
		var _ = this._, dayz = CT.cal.days.slice(),
			i, now = this.opts.now,
			year = now.getFullYear(), month = now.getMonth(),
			offset = new Date(year, month).getDay(),
			last = new Date(year, month + 1, 0).getDate(),
			prevlast = new Date(year, month, 0).getDate();

		for (i = offset - 1; i > -1; i--)
			dayz.push(CT.dom.div(prevlast - i, "other"));

		for (i = 1; i <= last; i++)
			dayz.push(this.day(i, month, year));

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
			// TODO: use CT.db.multi(...) in some cases?
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
				else {
					var amd = appz[tslot.schedule][month][date];
					if (!amd)
						amd = appz[tslot.schedule][month][date] = {};
					if (!amd[tslot.task.name])
						amd[tslot.task.name] = [];
					amd[tslot.task.name].push(tslot);
				}
			});
		});
	},
	orient: function() {
		CT.dom.setContent(this.node, [
			CT.dom.div(this.month(), "month"),
			CT.dom.div(this.days(), "days")
		]);
	},
	_build: function() {
		this.appointments();
		this.orient();
	},
	build: function() {
		var opts = this.opts, tasks = opts.appointments,
			slots = [], builder = this._build;
		if (opts.timeslots == "data")
			return builder();
		tasks.forEach(function(task) {
			slots = slots.concat(task.timeslots);
		});
		CT.db.multi(slots, function(tslots) {
			tasks.forEach(function(task) {
				task.timeslots = task.timeslots.map(function(tskey) {
					return CT.data.get(tskey);
				});
			});
			builder();
		});
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			now: new Date(),
			timeslots: "key",
			appointments: []
		});
		this.node = CT.dom.div(null, "cal");
		this.node.cal = this;
		this.build();
	}
});