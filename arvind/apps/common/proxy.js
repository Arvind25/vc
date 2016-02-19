var $    = require('jquery-deferred');
var log  = require('common/log').sub_module('common/proxy');
var rest = require('restler');

var proxy = {};
var default_port = 3141;

function add_route (key, value, proxy_port) {
	var _d = $.Deferred();

	/*
	 * The proxy is assumed to run locally on a well known port
	 * (likey 3141), unless overridden by the argument */

	var url = 'http://localhost:' + (proxy_port ? proxy_port : default_port) + '/api/route/add';
	var d = rest.postJson (url, {
		key : key,
		value : value
	});

	d.on('success', function () {
		log.info ({ key: key, value: value }, 'proxy route added');
		return _d.resolve();
	});

	d.on('fail', function (data, response) {
		log.error ({ data: data, response: response }, 'route add failed');
		return _d.reject('failed: ' + response);
	});

	d.on('error', function (err, response) {
		log.error ({ err: err, response: response }, 'route add failed');
		return _d.reject(err);
	});

	d.on('timeout', function (ms) {
		log.error ('route add failed (timeout)');
		return _d.reject('timeout');
	});

	return _d.promise();
}

proxy.add_route = function (key, value, proxy_port) {
	return add_route (key, value, proxy_port);
};

module.exports = proxy;
