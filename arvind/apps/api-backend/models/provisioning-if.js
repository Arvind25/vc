var $        = require('jquery-deferred');
var moment   = require('moment');
var rest     = require('restler');
var ERR      = require('common/error');
var mylog    = require('api-backend/common/log').child({ module : 'models/provisioning-interface'});

var prov_if = {};

prov_if.start = function (class_config) {

	var _d = $.Deferred();

	/*
	 * There could be multiple provisioning servers, and the 
	 * logic to decide which one to choose is not formalized
	 * at the moment. For now, the code assumes that the 
	 * provisioning server is running locally */

	var d = rest.postJson ('http://localhost:2178/prov/session/start', class_config);

	d.on('success', _d.resolve);

	d.on('fail', function (data, response) {
		mylog.error ({ info : {
				class_id : class_config.class_id,
				data : data,
				statusCode : response.statusCode,
				statusMessage : response.statusMessage,
			}}, 'post failed');
		_d.reject('timeout');
	});

	d.on('error', function (err, response) {
		mylog.error ({ info : {
				class_id : class_config.class_id,
				err : err,
				statusMessage : response.statusMessage
			}}, 'post error');
		_d.reject('timeout');
	});

	d.on('timeout', function (ms) {
		mylog.error ({ info : {
				class_id : class_config.class_id,
				ms : ms
			}}, 'post timeout');
		_d.reject('timeout');
	});

	return _d.promise();
};

module.exports = prov_if;
