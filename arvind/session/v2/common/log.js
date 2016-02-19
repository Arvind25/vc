var events   = require('events');
var bunyan   = require('bunyan');

var log = bunyan.createLogger ({ 
	name : 'vc',
	streams : [
		{
			name : "stdout",
			stream : process.stdout,
			level  : 'debug'
		}
	]
});

log.sub_module = function (mod) {
	return log.child ({ module : mod });
};


module.exports = log;
