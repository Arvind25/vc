var $              = require('jquery-deferred');
var moment         = require('moment');
var ERR            = require('common/error');
var sess_schema    = require('provisioning/lib/session-db-schema');
var db             = require('provisioning/common/db');
var mylog          = require('provisioning/common/log').child({ module : 'models/session-db'});

var sess_db = {};
var Schema;
var Model;
var db_conn = db.conn;

/*
 * Initialize */
db.emitter.on('db-connected', function () {
	Schema = sess_schema.schema ();
	Model  = db_conn.model(sess_schema.model_name, Schema);
});

sess_db.create = function (class_config) {
	var _d = $.Deferred ();
	var sess_dbo = new Model ({ class_config : class_config });

	return sess_dbo.create ();
};

sess_db.update_failure = function (sess_dbo, err, failure_step) {
	var _status = {
		state         : 'error',
		reason        : err,
		failure_step  : failure_step,
		ts            : moment().utc().toISOString()
	};

	mylog.debug ({ instance_id : sess_dbo.instance_id }, 'updating status for instance');
	Model.findOneAndUpdate (
		{ instance_id : sess_dbo.instance_id }, 
		{ $set : { status : _status }}, 
		function (err, num) {
				if (err) {
					mylog.error ({ err : err, sess_dbo : sess_dbo }, 'session-db update_failure error');
					return false;
				}
			mylog.debug ({ rows_affected : num }, 'session-db update_failure');
			return true;
		}
	);

	return true;
};

module.exports = sess_db;
