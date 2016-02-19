/* 
 * logger starts in passive mode i.e it buffers logs
 * until it receives the ip and port of Rishikesh
 */

define(function(require){
	var logger 	= require('fluent_logger');
	var buf 	= {};			/* what size */
	var logs 	= {};
	
	function init( info){			/* puts logger in active mode */
		/* 
		 * configure transport 
		 * setInterval for send 
		 */	
		logger.configure('vc',{
			host	:	info.host,
			port	:	info.port,
			timeout : 3.0
		});
		setInterval( send, 5000);
	}
	logs.sample_run = function(){
		logger.configure('sample',{ host:'127.0.0.1', port:'24224'});
		logger.emit('run',{record: 'hi from client'});
	};

	function add( smth, smthh){
		/* add_to_buffer( smth,smth); */
//		buf += smth;
	}

	function send(){ 			/* will be called after some interval */
		/*
		 * if buffer has something 
		 * 		read buffer and regenerate logs
		 * 		if connected 
		 * 			emit logs 
		 * 		else
		 * 			send to std output
		 */
		var record = {};

		record = { 'message': 'just a msg'};

		logger.emit('client', record); /* record should be a JSON */

	}
	return logs;
});
