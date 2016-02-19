/* The time has come to break the code in modules */

define(function(require){
	var mod_name = "lets-chat";						/* the name of this module */
	
	var $ 			= require('jquery'),
		events 		= require('events'),
		log 		= require('log')( mod_name, 'info'),
		framework 	= require('framework'),
		moment 		= require('./moment.min'),
		store 		= require('./store'),
		mod_message	= require('./message');

	var	f_handle 	= framework.handle('chat-box'),
		emitter 	= null,
		anchor 		= {},
		scroll_lock = false,
		my_info 	= {},
		msgTemplate = {},
		rooms 		= {
						main : {			/* leaving scope for pvt chat */
							id 			: null,
							joined 		: false,
							lastMessageId: 0
						}					
					  },
		users 		= {
						me : null
					  },
		connection  = {
						connected : false	
					  },
		socket 		= {},
		$messages 	= {};		/* will store the anchor of the message list */
		
	var chat_box = {};
	/*
	 * create connection
	 * join room
	 * and do your stuff
	 */


	chat_box.init = function (display_spec, custom, perms) {
			var _d = $.Deferred();

			log.info ('chat_box init called');

			init_linkify();							/* can be improved a little */
			if (!Date.now) {						/* some browsers don't support Date.now.. check if it works or not */
			  Date.now = function now() {
			      return new Date().getTime();
			    };
			
			}
			emitter = events.emitter("chat", mod_name );
			anchor = display_spec.anchor;
			var templates = display_spec.templates;
			var template  = f_handle.template( templates[0] );
			msgTemplate   = f_handle.template( templates[1] );

			if(!template || !msgTemplate){
				_d.reject ('chat-box: some template not found' );
			}

			var $room = template();
			$(anchor).append( $room);
			
			$messages = $('.lcb-messages');			/* get it once, not everytime */
			$('.lcb-entry-button').on('click', sendMessage);
			$('.lcb-entry-input').on('keypress',sendMessage);
			$('.lcb-messages-container').scroll( scrollHandler );
			/* make the text area uneditable, untill the connection is made(with the chat server) */
		 	$('.lcb-entry-input').attr("placeholder","Connecting To Chat...").prop('disabled', true);

			events.bind('framework:layout', layout_changed, 'chat-box');
			$('#widget-chat .lcb-room-header svg').on('click', handle_click);

			_d.resolve();
			return _d.promise();
	};
	chat_box.start = function (sess_info) {
		log.info ('chat box Stuff = ', sess_info);
		if (!sess_info) {
			log.error ('no session info !');
			return;
		}

		my_info = sess_info;
		store.server_url = sess_info.root_url;
		store.auth_token = sess_info.token;

		connect(sess_info)
		.then(
			function( sock){
				socket = sock;
				rooms.main.id = my_info.room_id;
				
				socket.on('connect', function(){
					emitter.emit('chat:connection', data = { 'status' : 'ok'});
					connection.connected = true; 
					log.info('connect','done');

					who_am_i();
					join_room(rooms.main.id);
				});
				socket.on('reconnect',function(){
					emitter.emit('chat:connection', data = { 'status' : 'ok'});				/* is it ok? */
					/* rejoin all rooms where joined is true, main room for now */
					rejoinRoom( rooms.main.id);
					log.info('reconnect done');
				});
				socket.on('error', function(err){
					emitter.emit('chat:connection', data = { 'status' : 'not-ok', 'reason' : err});
					log.error('Connection to server ' + sess_info.root_url + ' failed. Data = ', err);
				});
				
				socket.on('messages:new', function(msg){ 
					log.info('received message:', msg);  
					emitter.emit('chat:new-message', data = { 'from': msg.owner.id });
					append_message(msg); 
				});

				socket.on('messages:typing', function(data){ 
					log.info('received typing notif: ', data); 
					typing_handler(data.owner, data.room); 
				});

				socket.on('files:new', function( file){
//					addFile( file);
				});
				
				socket.on('disconnect', function(){
					connection.connected = false;
				});
			});
	};

	/*
	 * private methods
	 */

	function init_linkify(){				/* used to handle hyperlinks in the message */
			linkify 	= require('./linkify'),
			linkify();
			link_html 	= require('./linkify-html');
			link_html(window.linkify);
	}
	function connect( sess_info ){
		var _d = $.Deferred();
		log.info('logging','in');

		require([sess_info.root_url + '/socket.io/socket.io.js'],function( io){

			var sock = io.connect(
				sess_info.root_url,{
					reconnection 		 : true, 	/* defaults to true */
					reconnectionDelay 	 : 500,		/* defaults to 1000 */
					reconnectionDelayMax : 1000,	/* defaults to 5000 */
					timeout 			 : 10000, 	/* defaults to 20000 */
					query 				 : 'token=' + sess_info.token
				});
			_d.resolve( sock);
		});
		return _d.promise();
	}

	function who_am_i(){
		socket.emit('account:whoami',function(user){
			users.me = user;
		});
	}

	function rejoinRoom( room_id){
		join_room( room_id, true);
	}

	function join_room( room_id, rejoin ){
		if( !rejoin && rooms.main.joined){
			/* it is duplicate call from connect (after a reconnect) */
			return ;
		}
		log.info('connecting to', room_id);
		//check if socket is null
		socket.emit('rooms:join', { roomId : room_id, password : ''}, function(resRoom){
			rooms.main.joined = true;
			var room = resRoom; 											
			log.info('connected ', room);

			$('.lcb-entry-input').attr("placeholder","Got Something To Say?").prop('disabled', false);

			get_messages(room_id, rejoin? rooms.main.lastMessageId : 0 );
		});
	}

	function get_messages( room_id, since ){
		socket.emit('messages:list',{
			room 		: room_id,
			since_id 	: since,
			take		: 10,
			expand		: 'owner, room',
			reverse		: true			/* tells about the order of the messages */
		},function( messages){
			log.info('received_messsages', messages);
			scroll_lock = false;
			for(var i= messages.length-1; i>=0; i--){
				append_message (messages[i], true);
			}
		});
	}
	function sendMessage(e){
		if(e.type === 'keypress' && e.keyCode !== 13 || e.altKey){
			tell_typing.notify();
			return;
		}
		if(e.type === 'keypress' && e.keyCode === 13 && e.shiftKey){
			tell_typing.notify();
			/*
			 * shift+enter let u send multi line messages
			 * 	this is what sets the paste option
			 * 	on receive handle them differently (use pre tag)
			 */
			return;
		}
		e.preventDefault();


		var $textarea = $('.lcb-entry-input');
		var m = $textarea.val();
		if( !m )
			return;

		if( $.trim( m)){
			send_message( m);
		}
		tell_typing.clear();
		$textarea.val('');
	}

	function send_message( message ){
		socket.emit( 'messages:create',{ 'room' : my_info.room_id, 'text' :  message });
	}

	var lastMessageOwner = {};
	function append_message( messageObj, history ){
		if(!history){
			typing.remove( messageObj.owner);
		}
		rooms.main.lastMessageId = messageObj.id;	/* why shouldn't it be here? think!*/
		/* The case of shift+enter, multi line message */
		messageObj.paste=  /\n/i.test(messageObj.text);

		/* fragement or new message */
		messageObj.fragment = lastMessageOwner === messageObj.owner.id;
		messageObj.time = moment(messageObj.posted).calendar();
		messageObj.classs = (messageObj.owner.id === users.me.id)? "lcb-message-own" : "lcb-message swatch-" + color_manager.my_color( messageObj.owner.id );
		if (messageObj.fragment)
			messageObj.classs += " lcb-fragment";

		if( !messageObj.fragment){
			lastMessageOwner = messageObj.owner.id;
		}

		var $message = msgTemplate( messageObj);

		format_message( $message, function( html){
						$messages.append(/*'<li>' +*/ html);

						if( scroll_lock === false || messageObj.owner.id === users.me.id ){
							scrollTo( $messages[0] );
						}
		});
	}

	function format_message( html, cb){				/* here we get a HTML string, which is diff to manipulate */
		var text = $(html).find('.lcb-message-text').html();
		mod_message.format( text, function( res){
			if( res){
				res  = window.linkifyHtml ? window.linkifyHtml( res, {}) : res;
				html = html.replace(text, res);
			}
			cb( html);
		});
	}

	/* different colors for different users */
	var color_manager = {
		colors 			: [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
		index  			: 0, 
		get_next_color 	: function(){
									var temp = this.index;
									this.index = (++this.index) % this.colors.length;
									return this.colors[ temp ];	
						  },
		colorOf 		: {},			/* map of userid : color */
		my_color 		: function( id){
								var color = this.colorOf[id];
								if( !color){
									color = this.colorOf[ id] = this.get_next_color();
								}	
								return color;
						  }
	};

  /* typing notification related */
	
	var tell_typing = {
				timer : null,
				timeout : 5000,					/* typing evt once sent will be valid till 'timeout' then we need to send again */
				notify: function(){
							if( !this.timer){
								this.timer = setTimeout( function(){ this.timer = null; }.bind(this), this.timeout );
								this.emit();	/* emit_on_socket */
							}
						},
				emit : function(){
					socket.emit('messages:typing', {'room' : my_info.room_id, 'time': Date.now()}); /* Date.now needs smth for compatibility in <IE8 */
				},
				clear : function(){
					clearTimeout(this.timer);
					this.timer = null;
				}
		};

  	/* typing event receive events */
	var typing = require('./notif');
	function typing_handler(user, room){
		log.info(user.displayName+ ' is typing in the room: ' + room);

		if( user.id === users.me.id){
			log.info( 'this is me.. typing');
			return;
		}
		typing.someone(user);
	}

	/* auto-scroll related */

	function scrollHandler(){
		var msg_container = $('.lcb-messages-container')[0];
		var scrHeight  	= msg_container.scrollHeight;
		var scrTop 		= msg_container.scrollTop;
		var cltHeight= msg_container.clientHeight;
		if( scrHeight - scrTop < cltHeight + 10){
			scroll_lock = false;
		}
		else{
			scroll_lock = true;
		}
	}

	function scrollTo( $messages ){
    	//messages.scrollTop =  messages.scrollHeight ;
		$('.lcb-messages-container').scrollTop( $messages.scrollHeight );
	}

	log.info ('notify_box loaded');

	var current_layout;

	function layout_changed (ev, data) {
		/* Just note the current layout for now */
		current_layout = ev;
		if (current_layout != 'av-fullscreen')
			$('#widget-chat').removeClass('chat-fullheight');
		else
			$('#widget-chat').addClass('chat-fullheight');

		return;
	}

	/* This variable indicates the visibility of the chat widget in av-fullscreen
	 * layout _ONLY_. True initially */
	var am_i_visible = true;

	function handle_click (ev) {

		if (current_layout && current_layout === 'av-fullscreen') {
			/* Just toggle */

			if (!am_i_visible) {
				$('#widget-chat').addClass('chat-fullheight');
				am_i_visible = true;
			}
			else {
				$('#widget-chat').removeClass('chat-fullheight');
				am_i_visible = false;
			}
		}

		ev.preventDefault();
		return;
	}

	return chat_box;
});
