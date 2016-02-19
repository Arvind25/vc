var log = require ('./log');

var config = {};

/*
 * LOG/fluentd config here
 */
config.log = {
	tag : 'vc.apps',
	type : 'forward',
	/* Rishikesh is where all the log streams meet */
	rishikesh_host : 'localhost',
	rishikesh_port : '24224',
};

/*
 * API-BACKEND config here
 */
config.api = {};
config.api.mongo = 'mongodb://localhost/wiziq-v1';

/*
 * PROVISIONING config here
 */
config.prov = {};
config.prov.mongo = 'mongodb://localhost/prov-v1';

module.exports = config;
