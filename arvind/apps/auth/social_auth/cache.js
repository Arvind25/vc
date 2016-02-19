var log      = require( 'auth/common/log' ).child ({ 'sub-module' : 'cache' });
var $        = require( 'jquery-deferred' );
var args     = require( 'common/args' );

/*
 * local storage structure to store all user entries
 * fetched from mongodb in the beginning
 */ 
var credentials = {}; 

/*
 * get value from local structure corresponding to auth_type
 * and host_name
 */ 
function get ( auth_type ) {

	var _d = $.Deferred();

	/* if credentials object empty */
	if (!Object.keys(credentials).length === 0) {
		return _d.reject('Credentials undefined');
	}

	var host = args.session_server_ip () ? args.session_server_ip () : 'localhost';
	var _user_credentials = credentials[[ host, auth_type ]];

	/* if no user in db corresponding to host
	 * and auth_type */
	if (!_user_credentials) {
		return _d.reject('No entry found');
	}

	log.info({Info : _user_credentials },'user successfully fetched');

	_d.resolve(_user_credentials);
	return _d.promise();
}

/*
 * add entry in local structure corresponding
 * to credential_obj*/
function add ( credential_obj ) {
	/*
	 * creating a map corresponding to user data fetched
	 * from db
	 */ 
	credentials[[ credential_obj.hostName, credential_obj.authType ]] = credential_obj;
	log.info({Info : credentials[[ credential_obj.hostName, credential_obj.authType ]]},'Added successfully');

}

/*
 * invalidate a value in local storage if deleted from  
 * database*/
function invalidate ( credential_obj ) {
	
	delete credentials[[ credential_obj.hostName, credential_obj.authType ]]; 
	log.info('Deleted successfully');

}

var cache = {};
cache.get = get;
cache.invalidate = invalidate;
cache.add = add;
module.exports = cache;
