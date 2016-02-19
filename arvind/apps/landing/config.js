var fs  = require('fs');
var path= require('path');
var log = require('./common/log');
var config = {};

config.port = '2178';

/*
 * Path related configs
 */
config.top   = __dirname;
config.session_server = { default_port : 3179 };

module.exports = config;
