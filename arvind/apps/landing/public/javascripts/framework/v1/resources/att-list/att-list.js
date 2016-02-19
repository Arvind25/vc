/* 
 * List of users
 * present in the session
 */

define(function(require){
	var $ 			= require('jquery'),
		framework	= require('framework'),
		log 		= require('log')('att-list','info'),
		widget 		= require('./widget'),
		controls 	= require('./controls');
		listener 	= require('./listener');

	var att = {};
	
	att.init = function( display_spec, custom, perms){
		var _d = $.Deferred();

		if( !display_spec.anchor || display_spec.templates.length != 2){
			_d.reject('wrong info from backend');
			return _d.promise();
		}

		var templates = [],
			f_handle = framework.handle('att-list'),
			anchor = display_spec.anchor,
			trigger= $('#nav-attendees'); 	//i should be getting it from the framework instead
		
		templates.push( f_handle.template(display_spec.templates[0]) );
		templates.push( f_handle.template(display_spec.templates[1]) );

		trigger.on('click', toggle_visibility);
	
		$(anchor).hide();						/* should be visible on selection only */
		widget.init( anchor, templates, f_handle.identity, log)
			.then( 	controls.init.bind(undefined,f_handle.attendees,log) , 	_d.reject )
			.then( 	_d.resolve,				 								_d.reject );

		listener.init(log);			/* listen for attendees events. (For now) */
		
		return _d.promise();
	};

	att.start = function( info, class_info){
		var users = class_info.attendees; /* now we should get it from attendees api instead */
		log.info('received class info: ' + users.toString());
		
		users.forEach( function(user){
			widget.add_user( user);
		});
	};

	/*
	 *	private methods
	 */

	function toggle_visibility( evt){
		$('#widget-attendees').toggle();
		widget.toggle_visible();
		/* what else? */	
	}

	return att;
});
