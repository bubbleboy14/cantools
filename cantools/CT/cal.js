/*
This module contains a class, Cal, for calendar-based applications. Usage:

	CT.dom.setBody((new CT.cal.Cal({
		timeslots: "data", // or "key" (the default, for use w/ databases)
		appointments: [{
			name: "app 1",
			description: "the first appointment",
			editors: [],
			commitments: [],
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
			editors: [],
			commitments: [],
			timeslots: [{
				schedule: "daily",
				when: "Mon Oct 07 2019 12:00",
				duration: 1
			}]
		}, {
			name: "number D",
			description: "another one, blah blah bloo",
			editors: [],
			commitments: [],
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
		"October", "November", "December"],
	stamp: function(day, date, month, year) {
		return CT.cal.days[day] + " " + CT.cal.months[month] + " " + date + " " + year;
	},
	slot: function(tslot, appz, unslot) {
		var year = tslot.when.getFullYear(),
			month = tslot.when.getMonth(),
			date = tslot.when.getDate(),
			day = tslot.when.getDay(), aod, amy, amyd,
			pfunc = CT.data[unslot ? "remove" : "append"];
		if (tslot.schedule == "daily")
			pfunc(appz.daily, tslot);
		else if (tslot.schedule == "weekly")
			pfunc(appz.weekly[day], tslot);
		else if (tslot.schedule == "offday") {
			aod = appz.offday[day];
			if (!aod[tslot.taskkey])
				aod[tslot.taskkey] = [];
			pfunc(aod[tslot.taskkey], tslot);
		} else { // month year date... once, exception
			amy = appz[tslot.schedule][month][year];
			if (!amy)
				amy = appz[tslot.schedule][month][year] = {};
			amyd = appz[tslot.schedule][month][year][date];
			if (!amyd)
				amyd = appz[tslot.schedule][month][year][date] = {};
			if (!amyd[tslot.taskkey])
				amyd[tslot.taskkey] = [];
			pfunc(amyd[tslot.taskkey], tslot);
		}
	}
};

CT.cal.Cal = CT.Class({
	CLASSNAME: "CT.cal.Cal",
	_: {
		shift: function(diff) {
			this.opts.now.setMonth(this.opts.now.getMonth() + diff);
			this.orient();
		},
		update: function(dobj) { // get it? up date?
			var thaz = this;
			return function() {
				thaz.opts.now = dobj;
				thaz.orient();
			};
		},
		slots: function(task, appz) {
			task.timeslots.forEach(function(tslot) {
				tslot.task = task;
				tslot.taskkey = task.task ? task.task.key : task.key;
				tslot.when = new Date(tslot.when);
				CT.cal.slot(tslot, appz);
			});
		},
		slot: function(slot, dobj, cslots) {
			var ukey = window.user && user.core.get("key"), uslots = cslots.filter(function(c) {
				return c.task.steward.key == ukey;
			}), comms = cslots.map(function(s) {
				return s.task;
			}), volunteers = comms.map(function(comm) {
				var fn = comm.steward.firstName;
				if (comm.steward.key == ukey)
					fn += " (you)";
				return fn;
			}).join(", "), opts = this.opts, task = slot.task,
				taskname = task.name || task.task.name, adata,
				iseditor = task.editors.includes(ukey), amod;
			return CT.dom.div([
				slot.when.toTimeString().slice(0, 5) + " " + taskname,
				CT.dom.div(volunteers, "small")
			], "appointment", null, {
				onclick: function(e) {
					adata = [
						CT.dom.div(taskname, "bigger"),
						task.description,
						slot.duration + " hours"
					];
					if (iseditor) {
						adata.unshift(CT.dom.link("edit", function() {
							opts.click.edit(slot, dobj);
						}, null, "right padded"));
					}
					["steps", "requirements"].forEach(function(slist) {
						if (task[slist] && task[slist].length) {
							adata.push([
								CT.dom.div(slist, "big"),
								task[slist]
							]);
						}
					});
					adata.push([
						CT.dom.div("Volunteer", "big"),
						volunteers || "no volunteers yet!"
					]);
					if (opts.click.volunteer)
						adata.push(opts.click.volunteer(slot, dobj, uslots));
					if (iseditor && opts.click.exception && (slot.schedule != "once"))
						adata.push(opts.click.exception(slot, dobj));
					amod = CT.modal.modal(CT.dom.div(adata, "subpadded5"), null, {
						onclick: function() { amod.hide(); }
					});
					e.stopPropagation();
				}
			});
		}
	},
	slot: function(tslot) {
		CT.cal.slot(tslot, this._.appointments);
	},
	unslot: function(tslot) {
		CT.cal.slot(tslot, this._.appointments, true);
	},
	commit: function(tslot) {
		CT.cal.slot(tslot, this._.commitments);
	},
	uncommit: function(tslot) {
		CT.cal.slot(tslot, this._.commitments, true);
	},
	day: function(date, month, year) {
		var _ = this._, opts = this.opts, tname, n,
			appz = _.appointments, commz = _.commitments,
			dobj = new Date(year, month, date), day = dobj.getDay(),
			slots = appz.daily.slice().concat(appz.weekly[day].slice()),
			cslots = commz.daily.slice().concat(commz.weekly[day].slice()),
			emoyeda = appz.exception[month][year][date] || {},
			cemoyeda = commz.exception[month][year][date] || {},
			oncers = appz.once[month][year][date] || {},
			concers = commz.once[month][year][date] || {},
			offday = appz.offday[day], tk;

		for (tname in oncers)
			slots = slots.concat(oncers[tname]);
		for (tname in concers)
			cslots = cslots.concat(concers[tname]);

		slots.sort(function(a, b) {
			return a.when.toTimeString() > b.when.toTimeString() ? 1 : -1;
		});
		cslots = cslots.filter(function(slot) {
			var steward = slot.task.steward.key,
				exz = cemoyeda[slot.taskkey] || [];
			for (var i = 0; i < exz.length; i++)
				if (exz[i].task.steward.key == steward)
					return false;
			return true;
		});

		n = CT.dom.div([
			CT.dom.div(date, "right relative above"),
			CT.dom.div(slots.filter(function(slot) {
				// TODO: improve this filter
				tk = slot.taskkey;
				return (!emoyeda[tk] || !emoyeda[tk].length)
					&& (!offday[tk] || !offday[tk].length);
			}).map(function(slot) {
				return _.slot(slot, new Date(dobj.getTime()),
					cslots.filter(function(s) {
						return s.task.task.key == slot.task.key; // lol
					}));
			}), "abs all0")
		], (date == opts.now.getDate()) && "today");
		if (opts.click.date) {
			n.classList.add("pointer");
			n.onclick = function() {
				opts.click.date(date, month, year);
			};
		} else if (opts.update)
			n.onclick = _.update(dobj);
		return n;
	},
	days: function() {
		var _ = this._, opts = this.opts, now = opts.now,
			year = now.getFullYear(), month = now.getMonth(),
			offset = new Date(year, month).getDay(),
			last = new Date(year, month + 1, 0).getDate(),
			prevlast = new Date(year, month, 0).getDate(),
			i, appz = _.appointments, commz = _.commitments,
			dayz = CT.cal.days.map(function(day, di) {
				var daynode = CT.dom.div(day);
				if (opts.click.day) {
					daynode.classList.add("pointer");
					daynode.onclick = function() {
						opts.click.day(day, di);
					};
				}
				return daynode;
			});

		["once", "exception"].forEach(function(variety) {
			[appz, commz].forEach(function(section) {
				if (!section[variety][month][year])
					section[variety][month][year] = {};
			});
		});

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
	stewardship: function(steward, task, commitment) {
		steward.commitments = steward.commitments || {};
		if (commitment) {
			commitment.task = task;
			steward.commitments[task.name] = commitment;
		} else
			return steward.commitments[task.name];
	},
	unsteward: function(steward, task, commitment) {
		delete steward.commitments[task.name];
	},
	commitment: function(commitment, task) {
		this.stewardship(commitment.steward, task, commitment);
		this._.slots(commitment, this._.commitments);
	},
	appointment: function(task) {
		var thaz = this;
		this._.slots(task, this._.appointments);
		task.commitments.forEach(function(comm) {
			thaz.commitment(comm, task);
		});
	},
	appointments: function() {
		this.opts.appointments.forEach(this.appointment);
	},
	orient: function() {
		CT.dom.setContent(this.node, [
			CT.dom.div(this.month(), "month"),
			CT.dom.div(this.days(), "days")
		]);
	},
	build: function() {
		this.appointments();
		this.orient();
	},
	load: function() {
		var opts = this.opts, tasks = opts.appointments, builder = this.build,
			slots = [], commitments = [], cslots = [], uslots = [];
		if (opts.timeslots == "data")
			return builder();
		tasks.forEach(function(task) {
			slots = slots.concat(task.timeslots);
			commitments = commitments.concat(task.commitments);
		});
		CT.db.multi(slots.concat(commitments), function(objz) {
			tasks.forEach(function(task) {
				task.timeslots = task.timeslots.map(function(tskey) {
					return CT.data.get(tskey);
				});
				task.commitments = task.commitments.map(function(ckey) {
					var c = CT.data.get(ckey);
					cslots = cslots.concat(c.timeslots);
					uslots.push(c.steward);
					return c;
				});
			});
			CT.db.multi(cslots.concat(uslots), function(objz2) {
				tasks.forEach(function(task) {
					task.commitments.forEach(function(commitment) {
						commitment.steward = CT.data.get(commitment.steward);
						commitment.timeslots = commitment.timeslots.map(function(tskey) {
							return CT.data.get(tskey);
						});
					});
				});
				builder();
			});
		});
	},
	setNode: function() {
		var oz = this.opts;
		this.node = CT.dom.div(null, "cal");
		this.node.cal = this;
		this.node.value = function() {
			return oz.now.toDateString();
		};
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			now: new Date(),
			timeslots: "key",
			appointments: [],
			update: false, // if true, date shifts on date click
			click: {} // day, date, volunteer, edit, exception, offday
		});
		var _ = this._, appz;
		["appointments", "commitments"].forEach(function(aname) {
			appz = _[aname] = {};
			appz.daily = [];
			appz.weekly = CT.cal.days.map(function(d) { return []; });
			appz.offday = CT.cal.days.map(function(d) { return {}; });
			appz.once = CT.cal.months.map(function(m) { return {}; });
			appz.exception = CT.cal.months.map(function(m) { return {}; });
		});
		this.setNode();
		this.load();
	}
});