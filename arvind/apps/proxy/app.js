var express       = require('express');
var app           = express();
var body_parser   = require('body-parser');
var log           = require('./common/log');
var api           = require('./api');
var host          = require('./common/args').host;
var redis_cache   = require('./redis');
var ext_port      = 443;
var server_port   = 3141;

require('./docker-events');

app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());
app.use(log.req_logger);
app.use(log.err_logger);

app.use('/api', api);

log.info ({
	host : host,
	port : ext_port
}, 'Starting proxy');

app.listen(server_port);
