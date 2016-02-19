var fs  = require('fs');
var path= require('path');
var log = require('./common/log').sub_module('config');
var config = {};

config.port = '2178';

/*
 * Path related configs
 */
config.top   = __dirname;
config.views = path.join(config.top, 'views');
config.templates = {
	dir : __dirname + '/views/framework/templates'
};
config.core_backend = {};
config.provisioning_server = {};
config.session_server = { default_port : 3179 };
config.redis = { retry_interval : 10000 };

config.determine_site_addr = function () {
		fs.readFile('/etc/hostname', function (err, data) {


			if (err) {
				log.warn ('*******************************************************');
				log.warn ('* Error reading /etc/hostname !                       *');
				log.warn ('* The runtime Environment maybe not be set correctly. *');
				log.warn ('* Assuming Local Development evnironment.             *');
				log.warn ('*******************************************************');

				host = 'localhost:' + config.port;
				proto = 'http';
			}
			else {
				host = data.toString().trim() + ':' + config.port;
				proto = 'http';
			}

			config.site_addr = proto + '://' + host;
			log.warn ('* Setting Site address to ' + config.site_addr + ' *');
		});
};

module.exports = config;
