var express = require('express');
var bunyan = require('bunyan');
var log = bunyan.createLogger ({
	name : 'proxy-chat',
	streams : [
		{
			stream : process.stdout,
			level  : 'debug'
		}
	]
});

var proxy   = new require('redbird')({
	port : 80,
	ssl : {
		port : 443,
		key  : 'certificates/dev-key.pem',
		cert : 'certificates/dev-cert.pem'
	}
});
var app = express();

var host = process.argv[2];
if (!host) {

	/* Fall back on env if nothing is specified on the command line */
	host = process.env.PROXY_HOST_NAME;
	if (!host) {
		console.log ('Usage: node proxy-chat.js <hostname> or set env PROXY_HOST_NAME');
		process.exit (1);
	}
}

var ext_port = 443;

log.info ({
	host : host,
	port : ext_port
	}, 'Starting proxy');

/*
 * Routes for the landing page */
proxy.register(host + '/favicon.ico', "http://localhost:2178/favicon.ico");
proxy.register(host + '/landing/', "http://localhost:2178/landing/");
proxy.register(host + '/auth/', "http://localhost:2178/auth/");
proxy.register('chandra.me' + '/auth/', "http://localhost:2178/auth/");
/*
 * Routes for the session cluster docker for 'test-internal' */
proxy.register(host + '/session/test-internal', "localhost:7777/");
proxy.register(host + '/session/meghadoot', "localhost:7778/");
proxy.register(host + '/session/champoo', "localhost:7779/");

proxy.register(host + '/', "localhost:5000/");
//proxy.register(host + '/socket.io/', "localhost:5000//socket.io/");
