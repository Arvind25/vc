var events   = require('events');
var bunyan   = require('bunyan');
var config   = require('./config');
var fluent   = require('fluent-wiziq');

var log = {};
var emitter = new events.EventEmitter();
var children = [];

function connect_to_fluent_server () {

	var flogger;

	flogger = new fluent ({ 
			tag  : config.log.tag, 
			type : 'forward',
			host : config.log.rishikesh_host, 
			port : config.log.rishikesh_port
		},
		function () {
			var stream = { name: 'fluent', type: 'stream', stream: flogger};

			log.addStream(stream);
			for (var i = 0; i < children.length; i++)
				children[i].addStream(stream);

			log.info ('connected to fluentd server @ ' + config.log.rishikesh_host + ':' + config.log.rishikesh_port);
		});

		flogger.writeStream.on ('error', function (err) {

			log.removeStream('fluent');
			for (var i = 0; i < children.length; i++)
				children[i].removeStream('fluent');

			log.error (err, 'fluentd connection error');
		} );
}

var log_stdout = bunyan.createLogger ({ 
	name : 'vc',
	streams : [
		{
			name : "stdout",
			stream : process.stdout,
			level  : 'debug'
		}
	]
});

function sub_app (sub_app) {
	var child = log.child ({sub_app:sub_app});
	children.push(child);
	return child;
}

function sub_module (module) {
	var child = log.child ({module:module});
	children.push(child);
	return child;
}

log = log_stdout;

connect_to_fluent_server ();

module.exports.log = log;
module.exports.emitter = emitter;
module.exports.sub_app = sub_app;
module.exports.sub_module = sub_module;
