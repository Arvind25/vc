var $               = require('jquery-deferred');
var log             = require("./common/log").sub_module('class');
var config          = require("./config");
var events          = require('./events')('class');
var resources       = require("./resources");
var users           = require("./users");

var state = 'scheduled';

class_ = {};
class_.events = events;
class_.init = function (sess_info) {
	var _d = $.Deferred ();

	log.info ({state : 'PROVISIONING'}, '+-- transition -->');
	state = 'provisioning';
	provision (sess_info)
		.then (
			function () {
				state = 'provisioned';

				/*
				 * Start a timer for now. Will change this later */

				setTimeout (start, 2000);
				log.info ({state : 'PROVISIONED'}, '+-- transition -->');
				_d.resolve ('provisioned');
			},
			function (err) {
				log.error ({state : 'PROVISIONING-FAILED', err : err}, '+-- transition --> error');
				state = 'provisioning-failed';
				_d.reject.bind(_d);
			}
		);
	
	return _d.promise ();
};

class_.ready = function () {
	return (state === 'active') || (state === 'provisioned');
};

class_.started = function () {
	return (state === 'active');
};

function provision (sess_info) {
	return resources.load (sess_info);
}

function start () {
	state = 'active';
	log.info ({state : 'ACTIVE'}, '+-- transition -->');
	events.emit ('active');
}

module.exports = class_;
