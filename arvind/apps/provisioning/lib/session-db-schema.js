var $              = require('jquery-deferred');
var db             = require('provisioning/common/db');
var moment         = require('moment');
var hashes         = require('jshashes');
var class_schema   = require('common/class-config-schema');
var mylog          = require('provisioning/common/log').child({ module : 'models/session-db-schema'});

var schema = {};

schema.schema = function create_schema () {
	var Schema = db.mongoose.Schema;

	var sess_schema = new Schema ({
			class_config : [ class_schema (false) ],
			instance_id : { type : String, unique : true },
			times : {
				started : Date,
				instantiated : Date,
				ended : Date,
			},
			host : {
				ip : String,
				port : Number,
				proto : String
			},
			status : {
				state : String,
				reason : String,
				failure_step : String,
				ts : Date,
			}
		});

	sess_schema.methods.create = create;

	return sess_schema;
};

function generate_instance_id () {
	var seed_str = 'vc sess_db' + Date.now();
	return new hashes.SHA1().hex(seed_str);
}

function create () {
	var _d = $.Deferred ();

	this.instance_id          = generate_instance_id ();
	this.times.started        = moment().utc().toISOString();
	this.status.state         = 'starting';
	this.status.failure_step  = 'none';
	this.status.ts            = moment().utc().toISOString();

	this.save (function (err) {
		if (err) {
			mylog.error ({ err : err }, 'session-db-schema save error');
			return _d.reject (err, 'session-db-schema save', this);
		}

		mylog.info ('session-db saved ok');
		return _d.resolve(this);
	});

	return _d.promise ();
}

schema.model_name = 'session';

module.exports = schema;
