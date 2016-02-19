define( function(require){	
	/* 
	 * Store info of users ( identity as well as resource specific )
	 * API's for other modules to get and set data ( exported through framework )
	 * Skin will use these resources
	 * */

	var log 	= require('log')('attendees', 'info'),
		_events	= require('events');

	var store	= {}, 					/* vc_id : { identity : {}, meta : {}, rs_info : {} } */	
		att 	= {},
		people_ev = _events.emitter('framework:attendees', 'framework');


	att.fill_users = function( users){			/* to add users already present__before I joined */
		log.info ('fill_users:', users);
		if( users){
			users.forEach( function(user){
				add_to_map( user);
			});
		}
		/* should we emit some event here as well */
	};

	att.user_join = function( data){
		log.info('user_join called');			/* can be removed after 1st run */
		add_to_map( data[0] );
		people_ev.emit('in', data);
		return;
	};
	
	att.user_leave = function( vc_id){
		log.info('user_leave called');
		if( store[ vc_id ] ){ 					
			store[ vc_id ].meta.isActive = false;		
		}
		else{
			log.error ('this needs attention: user who left was not in attendees store::' + user);
		}
		people_ev.emit('out',vc_id);
	};

	
	/* 
	 * api for other modules
	 * */

	att.api = {

		get_identity : function( vc_id){
			return store[vc_id] ? store[vc_id].identity : null;
		},

		get_meta : function( vc_id){
			return store[vc_id] ? store[vc_id].meta : null;
		},

		get_users : function() {
			/* loop through store and return all the identities */
			return store;
		},

		set_meta 	: set_meta,

		save_info 	: save_info,

		get_info 	: get_info,

	};
	
	function set_meta( vc_id, _key, value, is_req) {	
		/* can be a request( by skin module maybe) as well as info( coming from (say)av), will change once skin is a part of the framework */	
		/*
		 * Known values for "known-key":			_key should be a known key
		 *     - 'audio-volume'
		 *     - 'microphone'
		 *     - 'speaker' (local speaker)
		 *     - 'camera'
		 *     - 'video'
		 *     - 'write-control'
		 * Any other value should return error.
		 * Possible values for all are:
		 *     - null or unknown (initial default state)
		 *     - true/false
		 *     - a number between 0 & 1 for 'audio-volume'
		 */
		if( !store[vc_id]){
			log.info('invalid vc_id::' + vc_id);
			return false;
		}

		switch( _key){
			case 'audio-control':
				if(!( value >= 0 && value <= 1)){
					log.info('invalid value:: ' + value);
					return false;
				}
				/* else fall down __don't break just yet */

			case 'video'	 	:
			case 'camera'	 	:
			case 'speaker'	 	:
			case 'microphone'	:
			case 'write-control':
				if( is_req){
					/* just shout: 'someone set state of this device' and the duty is done. */
					people_ev.emit('set_device_state',{ vc_id : vc_id, key : _key, value : value });	
				}
				else{
					/* somehow tell 'skin' about the change as skin is the one who maintains 'the state' of controls */
					/* untill skin becomes a part of framework sending an event should be fine, will eventually be a method call */
					people_ev.emit('control_changed', { vc_id : vc_id, known_key : _key, value : value});
					store[vc_id].meta[ _key] = value;
				}
				break;

			default:
				log.info('unknown key::' + _key);
				return false;
		}
		return true;
	}

	/* need to discuss this.. what needs to be done so that it improves our system n all */
	function save_info( rname, vc_id, key, value, flag_push){	
		var is_res = store[ vc_id].rs_info[rname];

		if( !is_res)
			store[ vc_id].rs_info[rname] = {};
		
		store[ vc_id].rs_info[rname][key] = value;
		
		/* skip it for now
			is_key = store[ vc_id].rs_info[rname].key;
			if( !is_key || !flag_push){
				store[ vc_id].rs_info[rname][key] = value;
			}
			else{
				store[ vc_id].rs_info[rname][key].push( value);
			}
		}*/
	}

	function get_info( rname, vc_id, key){
		if( !vc_id){
			/* return all user info.. need to discuss what 'user info' means? */
		}
		else if( rname && store[ vc_id] && store[vc_id].rs_info[rname]){
			return store[ vc_id].rs_info[rname][key];	
		}
		else{
			return null;
		}
	}

	/* 
	 * private methods
	 */

	function add_to_map( user){
		if( user){
			var id = user.vc_id;
			store[ id] = store [ id] || get_info_struct( user);
			store[ id].meta.isActive = true;
		}
		else{
			log.error ('user_join::: user is null');
		}
	}
	function get_info_struct( user){
		var info 	= {};
		info.identity 	= user;
		info.meta 		= {};			
		info.rs_info  	= {};
		return info;
	}

	return att;
});
