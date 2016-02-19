define( function(require){
	var client = require('./client');
	var store  = require('./store');
	var message = {};
	
	message.format = function( text, cb ){
		data = get_data( function( data){
			if( !data){
				cb(null);
			}
//			text =	trim( text);
			text =  emotes( text, data);
			cb( text);
		});
	};
	
	/* 
	 * private methods
	 */

	function get_data( cb){
		client.getEmotes( function(emotes){
			/* client.getReplacements */
			if(!emotes){
				cb( null);
			}
			var data = {
				emotes : emotes,
			};
			cb( data);
		});
	}

	function escape_html( text){
		return text.replace(/[\"&'\/<>]/g, function (a) {
												return {
													'"': '&quot;', '&': '&amp;', "'": '&#39;',
													'/': '&#47;',  '<': '&lt;',  '>': '&gt;'
												}[a];
										   });
	}

	function trim( text){
		return text.trim();
	}

	function find_in_array( arr, val){
		for ( var i=0, len=arr.length; i<len; i++){
			if( arr[i].emote === val){		/* check what is that exact condition */
				return arr[i];
			}
		}
	}

	function emotes( text, data){
		var regex = new RegExp('\\B(:[a-z0-9_\\+\\-]+:)[\\b]?', 'ig');

		/* temp logic */
/*		var emote = data.emotes[1];
		var image = escape_html( emote.image),
			emo   = escape_html( ':' + emote.emote + ':'),
			size  =  20;
			

//		return '<img class="emote" src="' + store.server_url + image + '" title="' + emo + '" alt="' + emo + '" width="' + size + '" height="' + size + '"/>';
	/* for now ist fine even if the above works*/			

		return text.replace( regex, function( group){
			var key = group.split(':')[1];
			var emote = find_in_array( data.emotes, key);
			if( !emote){
				return group;
			}	
			var image = escape_html( emote.image),
				emo   = escape_html( ':' + emote.emote + ':'),
				size  = emote.size || 20;//escape_html( emote.size || 20);    for now leave the security
			
			return '<img class="emote" src="' + store.server_url + '/' + image + '" title="' + emo + '" alt="' + emo + '" width="' + size + '" height="' + size + '"/>';
		});
	}

	return message;
});
