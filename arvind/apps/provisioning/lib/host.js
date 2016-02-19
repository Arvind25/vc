var $            = require('jquery-deferred');

var host = {};
var list = {};

host.start = function (sess_record) {
	var _d = $.Deferred ();

	connect (sess_record.host)
		.then (start_session_cluster.bind(null, sess_record), _d.reject.bind(_d))
		.then (_d.resolve.bind(_d), _d.reject.bind(_d));

	return _d.promise ();
};

function connect (_host) {
	var key = _host.proto + ':' + _host.ip + ':' + _host.port;

	if (list[key] && list[key].connected)
		_d.resolve (new Host(key));
}

function Host (key) {
	var host;

	if (!list[key])
		throw 'host key ' + key + ' unkown';
}

module.exports = host;
