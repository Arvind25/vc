var bunyan = require('bunyan');

var log = bunyan.createLogger ({
	name 	: 'proxy-server',
	streams : [
		{
			stream : process.stdout,
			level  : 'debug'
		}
	]
});

module.exports = log;

