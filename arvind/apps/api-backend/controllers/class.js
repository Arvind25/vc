var $            = require('jquery-deferred');
var helpers      = require('common/helpers');
var ERR          = require('common/error');
var sched        = require('common/sched');
var prov_if      = require('api-backend/models/provisioning-if');
var c_config     = require('api-backend/models/class-config');
var mylog        = require('api-backend/common/log').child({ module : 'controllers/class'});

var controller = {};

controller.create = function (req, res, next) {
	var err;
	var class_config = req.body;

	err = validate_params (class_config);
	if (err)
		return send_error.bind (res, req, ERR.bad_request(err));

	var job_id = sched.schedule (
					req, 
					class_config.time_spec.starts, 
					fire_class
		);

	if (!job_id)
		return send_error.call (res, req, ERR.bad_request('incorrect class parameters'));

	class_config.sched = { job_id : job_id };

	c_config.create (req, class_config)
		.then (
			/* All ij well */
			res.send.bind(res),
			/* fail */
			function (err) {
				sched.canel (req, job_id);
				send_error.bind (res, req);
			}
		);
};

function validate_params (class_config) {
	var duration = class_config.time_spec.duration;

	if (!helpers.is_numeric (duration)) {
			req.log.warn ({ controller : {
					duration : duration,
					}
			}, 'duration not numeric. rejected');

			return 'invalid duration (not numeric)';
	}
	return null;
}

controller.update = function (req, res, next) {
};

controller.remove = function (req, res, next) {
};

function fire_class (job_id) {
	var class_config;

	/*
	 * Get the class config */
	c_config.get.by_job_id (job_id)
		.then (
			/*
			 * Start the class.If there's an error, the runtime will need to handle it. */
			prov_if.start,
			function (err) {
				mylog.error ({ error : err }, 'start class error');
			}
		);
}

function send_error (req, err) {
	/*
	 * 'err' is custom error, always */
	var status = 500;

	if (!err.status)
		req.log.error ('no type set in error');
	else
		status = err.status;
	mylog.warn ({ status: status });

	this.status(status).send(err.message);
}

module.exports = controller;
