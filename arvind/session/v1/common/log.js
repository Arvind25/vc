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

log.sub_module = function (module) {
	var child = log.child ({module:module});
	return child;
};


module.exports = log;
