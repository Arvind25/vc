var log_stdout = require ('./common/args').logs;

var level = 'debug';

if (!log_stdout){
	level = 'error';
}

var proxy = new require('redbird') ({
	port   : 80,
	ssl    : {
		port    : 443,
		key     : 'certificates/dev-key.pem',
		cert    : 'certificates/dev-cert.pem',
	},
	bunyan : {
		name    : "redbird",
		stream  : process.stdout,
		level   : level
	}
});

module.exports = proxy;
