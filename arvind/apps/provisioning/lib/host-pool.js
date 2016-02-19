var $            = require('jquery-deferred');

var pool = {};

pool.get = function (sess_db_record) {
	var _d = $.Deferred ();

	sess_db_record.host = {};
	sess_db_record.host.ip = 'localhost';
	sess_db_record.host.port = 7711;
	sess_db_record.host.proto = 'https';

	_d.resolve (sess_db_record);

	return _d.promise ();
};

module.exports = pool;
