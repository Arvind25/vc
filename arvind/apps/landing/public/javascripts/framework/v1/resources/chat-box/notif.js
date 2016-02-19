define(function(require){
	var $ = require('jquery');
	var log = require('log')('chat-notif', 'info');
	var typing = {};
	var users = [], 
		timer = null,
		exp = 5000,
		clean_rate = 10000;

	typing.someone = function (user){
		if( !timer){
			timer = setInterval( clean, clean_rate);
//			setTimeout( setInterval( clean, clean_rate), expiry - clean_rate );
		}
		user.time = time_now();
		del( user);
		users.push( user );
		update();
	};

	typing.remove = function (user){
		if( del(user) ){
			update();
		}
	};

	function clean(){
		var len = users.length;
		if( !len){
			clearInterval( timer);
			timer = null;
			return;
		}
		var now = time_now();
		for ( var i=len-1, flag=false; i >=0; i--){
			if( (now - users[i].time) > exp){
				users.splice(i,1);					/* The array is being reIndexed here.. that's why reverse iteration */
				flag = true;	
			}
		}	
		if( flag){
			update();
		}
	}
	
	function del( user){
		var len = users.length;
		for( var i=0; i<len; i++ ){
			if(users[i].id === user.id){
				users.splice(i,1);
				return true;
			}
		}
		return false;
	}

	function update(){
		var len = users.length;
		if(!len){
			/* clear notification area */
			$('.lcb-notification-bar').html('');
			log.info('no one is typing');
			return;
		}
		var notif =  [];
		notif.push(users[len-1].displayName) ;
		switch( len ){
			case 1:
				notif.push( 'is');
				break;
			case 2:
				notif.push( 'and ' +  users[len-2].displayName  + ' are' );
				break;
			default:
				notif.push( ', '    + users[len-2].displayName  + ' and ' + (len-2).toString() + ' others are');
		}
		notif.push( 'typing...');
		notif = notif.join(' ');        /* avoids extra st  ring objs and executes faster than '+' */
		log.info( notif );
		/* fill notification area */
		$('.lcb-notification-bar').html(notif);
	}
	
	function time_now(){
		return Date.now();
	}

	return typing;
});
