var $              = require('jquery-deferred');
var ERR            = require('common/error');
var cl_schema      = require('common/class-config-schema');
var hashes         = require('jshashes');
var db             = require('api-backend/common/db');
var mylog          = require('api-backend/common/log').child({ module : 'models/class-config'});

var config = {};
var config_model;
var db_conn = db.conn;

/*
 * Initialize */
db.emitter.on('db-connected', function () {
	config_model  = db_conn.model ('class_config', cl_schema (true));
});

function generate_class_id () {
	var seed_str = 'vc class id' + Date.now();
	return new hashes.SHA1().hex(seed_str);
}

config.create = function (req, class_config) {
	var d = $.Deferred();
	var class_doc = new config_model (class_config);

	class_doc.class_id = generate_class_id ();

	/*
	 * This would be done, typically, for testing */
	if (class_config.override_class_id)
		class_doc.class_id = class_config.override_class_id;

	class_doc.save (function (err) {
		if (err) {
			req.log.error ({ err : err }, 'class config save error');
			return d.reject (ERR.internal(err.errmsg));
		}

		req.log.info ({ class_doc : class_doc }, 'class config saved ok');
		d.resolve (class_doc);
	});

	return d.promise();
};

config.remove = function (req, class_doc) {
	var d = $.Deferred();

	class_doc.remove ({ class_id : class_doc.class_id }, function (err) {
		if (err) {
			req.log.error ({ err : err }, 'class config remove error');
			return d.reject (ERR.internal(err.errmsg));
		}

		req.log.info ({ class_id : class_doc.class_id }, 'class config removed ok');
		d.resolve (class_doc);
	});

	return d.promise();
};

config.get = {
	by_job_id : get.bind (null, 'sched.job_id')
};

function get (field, value) {
	var d = $.Deferred();
	var query = {};

	query[field] = value;

	config_model.findOne (query, function (err, class_doc) {

		if (err) {
			req.log.error ({ err : err }, 'class get.by_' + field + ' error');
			return d.reject (ERR.internal(err.errmsg));
		}

		d.resolve (class_doc);
	});

	return d.promise();
}

module.exports = config;
