var $            = require('jquery-deferred');
var sess_db      = require('provisioning/models/session-db');

var pool = {};

function Session (sess_dbo) {
	this.sess_dbo = sess_dbo;
}

Session.prototype.add_host = function (host) {
};

pool.add = function (class_config) {
	sess_db.create (class_config)
		.then (
		);
};

module.exports = pool;
