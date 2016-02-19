/* 
 *	read api_spec in docs 
 *	folder to know about 
 *	event handling (namespace, binder etc.).
 */

define(function(require){

	var _events = require('events'),
		controls= require('./controls'),
		widget 	= require('./widget');

	var evt_namespace = "framework:attendees",
		binder  	  = "att-list",
		listener 	  = {},
		log 		  = {};

	listener.init = function(logger){
		log = logger;
		_events.bind( evt_namespace, evt_handler, binder);
	};

	function evt_handler( evt, data){
		
		switch( evt){
			case 'in':
				user = data[0];
				widget.add_user( user);
				break;

			case 'out':
				widget.remove_user(data);
				break;

			case 'control_changed':
				controls.change( data.vc_id, data.known_key, data.value);

			default:
				log.info('some event: ' + evt +' @atl_skin, not my problem');
		}	
	
	}

	return listener;
});
