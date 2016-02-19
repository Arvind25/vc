define( function( require){
	var $		= require('jquery');
	var store 	= require('./store');

	var client = {};
	var extras = {};
	client.start = function(){
		getEmotes();
		getReplacements();

	};

	client.getEmotes = function( cb){
		if( !extras.emotes){

			/* 
			 * curl -H "Authorization: Bearer NTY0ZjVmNDU5NTFmYzBiMTFiMWEyMTQzOjQyOTJlNjQzNzJhNDdmZWMxY2JmNTMyYjVjZWUyZjc5OGUzNGI3MDVhZmI2ZmU0Mw==" http://localhost:5000/extras/emotes
			 *
			 * that works
			 *
			 * */
		 	 extras.emotes = $.ajax({ 									/* what if it throws an error(say cross domain or smth) */
				 				url :  store.server_url + '/extras/emotes',
								headers : { "Authorization" : "Bearer " + store.auth_token }	/* a promise */
			 });
		}
		if( cb){
			extras.emotes.done( cb);
		}
	};

	function getReplacements( cb){
		if( !extras.replacements){
			extras.replacements = $.get( store.server_url + '/extras/replacements');	/* a promise */
		}
		if( cb){
			extras.replacements.done( cb);
		}
	}

	return client;
});
