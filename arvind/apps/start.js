var bunyan 				= require('bunyan');
var config 				= require('common/config');
var fluent       		= require('fluent-wiziq');

var log;

function connect_to_fluent_server () {

	var flogger;

	flogger = new fluent ({ 
			tag  : config.log.tag, 
			type : 'forward',
			host : config.log.rishikesh_host, 
			port : config.log.rishikesh_port
		},
		function () {
			log.info ('connected to fluentd server @ ' + config.log.rishikesh_host + ':' + config.log.rishikesh_port);
			log = bunyan.createLogger ({
				name : "vc",
				streams : [
					{
						name : "stdout",
						stream : process.stdout,
						level  : 'debug'
					},
					{
						name : "fluent",
						stream : flogger,
						level  : 'debug'
					},
				]
			});
			callback (log);
		});

		flogger.writeStream.on ('error', function (err) {
			log = bunyan.createLogger ({ 
				name : 'vc',
				streams : [
					{
						name : "stdout",
						stream : process.stdout,
						level  : 'debug'
					}
				]
			});

			log.error (err, 'fluentd connection error');
			callback (log);
		} );
}

connect_to_fluent_server (function (log) {
	require('app');
});
