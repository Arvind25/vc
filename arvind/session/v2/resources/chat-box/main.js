var $ = require('jquery-deferred');
var rest = require('restler');
var chat = {};
var m_room = {};  //master room
var cookie_admin = {};
var root_url = {};
var users = {};
var req_timeout = {};

/*
 * Login as admin and create a room
 */
chat.init = function (myinfo, common, handles) { 

	var _d = $.Deferred ();
	var log = handles.log;

	log.info ({ myinfo : myinfo }, 'init');
	
	root_url 	= myinfo.custom.server_url;
	req_timeout = myinfo.custom.req_timeout;
	var random_str  = get_random_string();
	/*
	 * create a master room for the session with the following data
	 */
    m_room.name 	= 'room' + random_str;			
	m_room.slug		= 'sess' + random_str;
	m_room.desc  	= 'desc' + random_str;
//	room.participants = added in allowuser method
	
	var _d_login	= {},
	    _d_room	= {};	

	/*
	 * login related calls : admin account (don't get confused, admin is just a name, not a role. Hence no speacial perms yet)
	 */
	_d_login = login_to_letsChat( 'admin', 'admin1234' );

	_d_login.then(	
			function done( cookie ){
				log.debug ({ cookie: cookie }, 'cookie-admin');
				cookie_admin = cookie;
				_d_room = create_room( m_room.name, m_room.slug, m_room.desc, log);
				_d_room.then( 
						function room_done( rid ){
							log.info ({ room_id : rid }, 'Room ID');
							m_room.id = rid;			//store room id for session
							_d.resolve(); 

					  	},
						function room_failed( message ){
							log.error ({ err: message }, 'room creation failed');
							_d.reject(message);	
						}
					);	
			},
			//fail callback
			function fail( message ){
				log.warn({ err: message }, 'login failed');
				_d.reject(message);
			}
	);

	return _d.promise ();
};


chat.init_user = function (user, prev_info, log) { 
	var _d = $.Deferred ();

	if (prev_info) {
		log.info ({ prev_info : prev_info }, 'reusing');
		_d.resolve(prev_info);
		return _d.promise ();
	}

	if( !m_room.id){
		log.error({ user : user }, 'no room found');
		_d.reject('no room created');
		return _d.promise();
	}
	var uname 	= {},	
	    passwd 	= {},
	    cookie_user	= {},
	    user_token 	= {};
	/*
	 * create a user 
	 * username will be saved in lowercase(whatever you pass) and certain queries will not work if uppercase letters are found in username.
	 * eg. WizIQ will be saved as 'wiziq'
	 */
	uname 	= user.vc_id + get_random_string();					/* add some 5chars random string here, just avoiding removeUser */
	passwd 	= generate_password( uname );
	log.info ({ username : uname, password: passwd, user : user }, 'generated username/password');

	var _d_create = create_user( uname, passwd, user, log );
	_d_create.then(
		function done (message) {
			log.info({ username : uname }, 'user creation ok');
			var _d_login = login_to_letsChat( uname, passwd);
			_d_login.then( 
				function done(cookie){					//is it ok creating methods with the same name
					cookie_user = cookie;
					get_token( cookie_user )
					.then(	
						function gotToken( token ){
							user_token = token;
							/*
							 * add the user to the room so that room becomes visible to the user
							 */
							allow_user_to_room( m_room, uname.toLowerCase(), log )
								.then(
									function(){
										log.info({ username : uname }, 'user allow room ok');
										_d.resolve({
										'root_url' : root_url,
										'token'    : user_token,
										'room_id'  : m_room.id,
										'username' : user
										});		
									},
									function (err) {
										log.info({ username : uname, err: err }, 'user allow room error');
										_d.reject(err);
									}
								);
						},
						function noToken( message ){
							_d.reject( message );
						}
					);
				},
				function fail(message){
					_d.reject( message );
				}
     		);
		},
		function fail(message){
			_d.reject( message );			
		}
	);
	return _d.promise ();
};
function allow_user_to_room( room, uname, log){
	var _d = $.Deferred();
	/*
	 * username is lowercase
	 * no duplicate entries
	 * the list sent will be copied as it is(previous data will be overwritten), so you might want to retrieve the list first and then
	 * send 
	 * but in our case the local copy should be the same 
	 */
	users = users +(!users ? '' : ',' )  + uname; //added to list for now
	rest.put( root_url + '/rooms/' + m_room.id,
			 {
			 	headers 	: 	{ cookie : cookie_admin },
				timeout		: 	req_timeout,
			 	data 		:	
					{
						id 				: m_room.id,
						name 			: m_room.name,
						slug			: m_room.slug,
						description 	: m_room.desc,
						participants 	: users,
						password		: ''
					}
			 }
			).on('complete', function(data,res){
				log.info({ data:data }, 'update request');
				_d.resolve();			
			}).on('timeout', function(){
				_d.reject(' req timed out');
			});
	return _d.promise();
}
function get_random_string(){
	return  Math.random().toString(36).substr(2, 5);
}
function generate_password( username ){
	//maybe we will store it to some list
	return 'computerg';
}

function create_user(username, password, user_info, log) {
	var _d = $.Deferred ();
	/*var email	 = user_info.emails ? (
					user_info.emails.length > 0 ? user_info.emails[0].value : username + '-pseudo@webrtc.vc'
					): username + '-pseudo@webrtc.vc';*/
	var email = username + '-pseudo@webrtc.vc';
	var display_name = user_info.displayName;
	var first_name = display_name.split(' ')[0];
	var last_name = display_name.split(' ')[1] || '*';
	var chat_data = { 
		'username' 	: username,
		'email'	   	: email,
		'display-name'  : display_name,
		'first-name'	: first_name,
		'last-name'	: last_name,
		'password'	: password,
		'password-confirm' : password 
	};

	rest.post( root_url + '/account/register',{ 
		timeout : req_timeout,
		data : chat_data
	}).on('complete', function( data){
		if(data.status === 'success'){
			log.info ({ data: data }, 'create user ok');
			return _d.resolve( data.message );
		}

		log.error ({ err: data.message }, 'create user error');
		_d.reject( data.message );

	}).on('timeout', function(){
		_d.reject('request timed out');
	});
	return _d.promise();
}

function login_to_letsChat( username, password ){
	var _d = $.Deferred ();
	var final_cookie 	= {};

	rest.post( root_url + "/account/login",{
		timeout 	: req_timeout,
		data 		: { 'username' : username, 'password' : password }
	}).on('complete', function(result, response){
		try{
			if( response && response.headers ){
				final_cookie = JSON.stringify(response.headers['set-cookie'] );
				final_cookie = final_cookie.substr(2, final_cookie.indexOf(';') - 2);
				_d.resolve( final_cookie  );
			}
			else{
				_d.reject('could not log-in to ' + root_url);
			}
		}
		catch( e){
			_d.reject('error reading cookie');
		}
		
	}).on('timeout', function(){
		_d.reject('request timed out');
	});
	
	return _d.promise ();	
}

function get_token( cookie ){
	var _d = $.Deferred();
	rest.post( root_url + '/account/token/generate',{  
		headers : { 'cookie' : cookie },
		timeout : req_timeout
	}).on('success',function( response ){	
		_d.resolve( response.token );
	}).on('complete',function( data ){
		if(_d.state() === 'pending'){
			_d.reject('could not get token');
		}
	}).on('timeout',function(){
		_d.reject('request timed out');
	});
	return _d.promise();
}

function create_room( name, short_name, desc, log ){
	var _d = $.Deferred ();
//	_d.resolve( "56402abbc1b356030b53bbb5");		// just use one room while dev. 
//	return _d.promise();

	rest.post( root_url + '/rooms', {				//timeout can be added 
			headers : { cookie : cookie_admin },
			timeout : req_timeout,
			data    : { 
					"slug" 		: short_name,
					"name" 		: name,
					"description" 	: desc,
					"private"		: true
				  }

		}).on('success', function( room ){
			if( room && room.id ){
				_d.resolve( room.id );
			}
		}).on('complete',function(data){
			log.info ({ data:data }, 'create room post request ok');
			if( _d.state() == 'pending'){
				_d.reject('room creation failed');
			}
		}).on('timeout',function(){
			_d.reject('req timed out');
		});
		// add handlers for onfailure, onerror, ontimeout etc.
	return _d.promise(); 
}

function delete_room( id, log ){
	var _d = $.Deferred ();
	rest.del(
		root_url + '/rooms' + '/' +  id, 
		{ headers : { cookie : cookie_admin  }  }
	).on('success',function(data){
		log.info ({ data:data }, 'delete room ok');
		_d.resolve();
	}).on('complete', function( data ){
		if( _d.state() == 'pending'){
			log.error ({ data:data }, 'delete room failed');
			_d.reject('room delete failed');
		}		
	});
	return _d.promise();	
}

module.exports = chat;
