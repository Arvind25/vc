var minimist  = require('minimist');
var log = require('common/log').log;

var _argv = minimist(process.argv.slice(2));

log.debug ({ args : _argv}, 'command line arguments');
log.debug ({ env : {
		VC_SESS_IP : process.env.VC_SESS_IP,
		VC_SESS_PORT : process.env.VC_SESS_PORT,
		VC_SSL : process.env.VC_SSL
	}}, 'env');

var args = {};

args.session_server_ip = function () {
	var val = _argv['sess-ip'];
	if (!val)
		val = process.env.VC_SESS_IP;
	return val;
};

args.session_server_port = function () {
	var val = _argv['sess-port'];
	if (!val)
		val = process.env.VC_SESS_PORT;
	return val;
};

args.session_server_ssl = function () {
	var val = _argv['ssl'];
	if (!val)
		val = process.env.VC_SSL;
	return val;
};

module.exports = args;
