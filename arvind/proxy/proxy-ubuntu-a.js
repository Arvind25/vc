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
proxy.register(host + '/landing/', "http://localhost:2178/landing/");
proxy.register(host + '/auth/', "http://localhost:2178/auth/");
/*
 * Routes for the session cluster docker for 'test-internal' */
proxy.register(host + '/session/test-internal', "localhost:7777/");
proxy.register(host + '/session/meghadoot', "localhost:7778/");
proxy.register(host + '/session/sujitsan', "localhost:7779/");
proxy.register(host + '/session/dineshsan', "localhost:7780/");
proxy.register(host + '/session/maneesh', "localhost:7781/");
proxy.register(host + '/session/raminder', "localhost:7782/");
proxy.register(host + '/session/ceo', "localhost:7783/");
proxy.register(host + '/session/gurjinder', "localhost:7784/");
proxy.register(host + '/session/rohit', "localhost:7785/");
proxy.register(host + '/session/faisal', "localhost:7786/");
proxy.register(host + '/session/ashutosh', "localhost:7787/");
proxy.register(host + '/session/guru', "localhost:7788/");
proxy.register(host + '/session/rishi', "localhost:7789/");
proxy.register(host + '/session/parth', "localhost:7790/");
proxy.register(host + '/session/sunil', "localhost:7791/");
proxy.register(host + '/session/rahul', "localhost:7792/");
proxy.register(host + '/session/kalyan', "localhost:7793/");
proxy.register(host + '/session/qa', "localhost:7794/");

proxy.register(host + '/', "localhost:5000/");
proxy.register(host + '/socket.io/', "localhost:5000/socket.io/");
proxy.register(host + '/log', "localhost:24224/");
