define( function(require){
	var search 		= require('./search');

	var my_namespace= '_att_skin';	/* because we don't want an element with id=vc_id *
									 * what if some other resource has such an element and it does $('#vc_id').remove() */
	var user_tpt 	= {},
		widget_att 	= {},
		$anchor 	= {},
		log 		= {},
		is_first_user = true;

	widget_att.init = function( anchor, templates, identity, logger){
		var _d = $.Deferred();
	
		log = logger;	
		$anchor = $(anchor);			/* just search once */
		var wrapper_tpt = templates[0];
		format(identity);				/* make fit for template */
		$anchor.append( wrapper_tpt( identity) );
		
		user_tpt = templates[1];
		
		_d.resolve();
		return _d.promise();
	};

	widget_att.add_user = function(user){
		var _d = $.Deferred();

		/* make fit for template */
		format( user);
		
		/*  
		 * user.vc_id is must for every user, 
		 * as this id is used as element id in our ul 
		 * and hence is required while removing li
		 */
		if( is_first_user){
			var $ele = user_tpt(user);
			if( !$ele){
				log.info('template creation failed');
			}

			$('#atl-list').append( $ele);		/* why is it hardcoded */
			search.init(); 
			is_first_user = false; 
		} 
		else { 
			search.add( user);
		}
		
		_d.resolve();
		return _d.promise();
	};

	widget_att.toggle_visible = function(){
		$anchor.toggle();
	};

	widget_att.remove_user = function(data){
		console.log('remove: '+ data );
		search.remove( data + my_namespace);
	};

	function format( user){
		var avatar_def = "http://www.gravatar.com/avatar/?d=mm&s=40";
		user.avatar = user.photos ? user.photos[0].value : avatar_def;
		user.time	= user.vc_auth_ts || "---";
		user.email 	= user.emails ? user.emails[0].value  : "-----" ;
		user.authvia= user.authvia || "---";
		user.att_id = user.vc_id + my_namespace;
	}

	return widget_att;
});
