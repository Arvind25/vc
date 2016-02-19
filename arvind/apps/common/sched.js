var ERR         = require('common/error');
var helpers     = require('common/helpers');
var moment      = require('moment');
var mylog       = require('api-backend/common/log').child({ module : 'models/sched'});

var sched = {};
var job_id_seed = moment().format('x');
var jobs = {};

mylog.debug ({ job_id_seed : job_id_seed }, 'job id seed');

/*
 * NOTE: the 'when' is assumed to be in Universal time */
sched.schedule = function (req, when, job) {

	if (!can_schedule (req, when))
		return null;

	return schedule (req, when, job);
};

sched.cancel = function (req, job_id) {

	if (!jobs[job_id]) {
		req.log.warn ({ schedule : { job_id : job_id } }, 'cant remove - no such job');
		return false;
	}

	clearTimeout (jobs[job_id].timer_id);
	delete jobs[job_id];

	req.log.info ({ schedule : { job_id : job_id } }, 'job removed');

	return true;
};

var margin_secs = 5;

function can_schedule (req, when) {
	var now = moment ();
	var after = now.add(margin_secs, 's');
	var sched_time = moment(when);

	if (!sched_time.isValid()) {

			req.log.warn ({ schedule : {
					when : when,
					}
			}, 'invalid date/time. rejected');

			return false;
	}

	if (sched_time.isBefore(after)) {

			req.log.warn ({ schedule : {
					when          : when,
					time_to_start : moment().diff(moment(when))/1000 + ' secs',
					margin_secs   : margin_secs 
					}
			}, 'schedule rejected - should be atleast ' + margin_secs + ' secs into the future');

			return false;
	}

	return true;
}

function schedule (req, when, job) {
	var time_to_start = moment(when).diff(moment());

	var job_id = generate_job_id ();

	jobs[job_id] = {
		job_id   : job_id,
		when     : when,
		req_id   : req.req_id,
		job      : job
	};

	jobs[job_id].timer_id = setTimeout (fire_schedule.bind ( jobs[job_id] ), time_to_start);

	req.log.info ({ schedule : {
				job_id      : job_id, 
				when        : moment(when).toISOString(),
				starts_in   : time_to_start/1000 + ' secs',
			}}, 
		'new schedule');

	return job_id;
}

function fire_schedule () {
	mylog.info ({ schedule : {
			job_id : this.job_id,
			req_id : this.req_id,
		}
	}, 'job fired');

	this.job (this.job_id);
}

var inc = 0;
function generate_job_id () {
	/* just trying to keep things unique across reboots */
	inc++;
	return job_id_seed + ':' + inc;
}

module.exports = sched;
