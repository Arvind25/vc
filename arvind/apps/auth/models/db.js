var $        = require( 'jquery-deferred' );
var mongodb  = require( 'mongodb' );
var mongoose = require( 'mongoose' );
var args     = require( 'common/args' );
var log      = require( 'auth/common/log' ).child ({ 'sub-module' : 'auth-db' });
var cache    = require( 'auth/social_auth/cache' );

var db_url = "mongodb://localhost/wiziq-auth"; 
var Credential;
var Schema;
var userSchema;
var connection = mongoose.createConnection (db_url);

connection.on ( 'error', function (err) {
	log.error ({ error : err }, 'Connection error to mongodb');
	process.exit (1);
});

connection.on ( 'disconnected', function () {
	log.warn ('disconnected');
});

connection.on ( 'connected', function () {
	log.info ('connected');
});

connection.once ( 'open', function (callback) {
	log.info ({ db_url : db_url }, 'connection OK');
	create_schema_model ()
		.then( 
			  function done () {
				  fill_cache_from_db ();
			  },
			  function fail( err ) {
				  log.error({ err: err},'Error while creating schema model');
			  }
        );
});


/* For now connect to db and then create a schema there, if not present already,
 * this was done just to check addition of entries to db via code.*/

function create_schema_model () {
	
	var _d = $.Deferred();

	if( !Schema ){
		Schema = mongoose.Schema;
	}

	if( !userSchema ){
		userSchema = new Schema({
			hostName     : { type: String, required: true },
			authType     : { type: String, required: true },
			clientID     : { type: String, required: true },
			clientSecret : { type: String, required: true },
			callbackURL  : { type: String, required: true }
		});

		userSchema.index({ hostName: 1, authType: 1}, { unique: true });
	}

	if( !Credential ){
		Credential = connection.model('Credential', userSchema);
	}

	var cred = new Credential({
		hostName     : 'akshit.me',
		authType     : 'google',
		clientID     : '794373405384-6u7bipelrp33kh8samdgsks0migb561d.apps.googleusercontent.com',                                            
		clientSecret : 't4xiO3YLbpDUEIz1PI8AA2wJ',
		callbackURL  : 'https://akshit.me/auth/auth/google/callback'
	});

	/* This is done to search for any entry with same combination of hostname
	   and authtype add only if not present. this avoids duplicacy */

	Credential.findOne({ 'hostName' : cred.hostName , 'authType' : cred.authType }, function (err, olduser) {

	    if (err) {
			log.error ({ err : err, cred : cred }, 'add error');
			_d.reject(err);
			return;	
		}		       
	   
		if (olduser) {
			log.warn ({ cred : cred }, 'duplicate entry');
			_d.resolve();
			return;
		}
		/*
		 * All ij well. Add the entry */
		cred.save(function (err, done) {	
  			if (err) {
				log.error ({ err: err, cred : cred }, 'save error');
				_d.reject(err);
				return;
			}
			
			log.info({Info : cred},'Credentials saved successfully to db');
			_d.resolve();
		});
	});

	return _d.promise();	
}

/*
 * get all credentials from wiziq_auth db
 */
function get_all () {

	var _d = $.Deferred();
	Credential.find({}, function(err, users) {
		if (err) {
			log.error ({ err: err }, 'find error in db (get_all)');
			return _d.reject(err);
		}
		_d.resolve(users);
	});
	return _d.promise();

}

/*
 * get all credentials from wiziq_auth db and 
 * store them locally in cache
 */ 
function fill_cache_from_db () {

	Credential.find({}, function(err, users) {
		if (err) {
			log.error ({ err: err }, 'find error in db (get_all)');
			return;
		}
		users.forEach(function(user) {
		        cache.add(user);
		});

	});

}

/*if data present in local identity structure
  -> fetch from it
  else
  -> connect to mongo db (if not connected already)
  -> fetch data from db, store it locally and use it  		
  "else" part has been implemented in the following function*/

function get (authType,req,res)
{
	var _d = $.Deferred();

	/* Return if connection is not established */
	if ( !connection || (connection.readyState != 1  )) {
		_d.reject();
		return _d.promise();
	}		

	var host = args.session_server_ip () ? args.session_server_ip () : 'localhost';

	Credential.findOne({ 'hostName' : host, 'authType' : authType }, function (err, result) {
		if (err || !result) {
			log.error({err: err, auth_type: authType, host: host, result: result }, 'get: find error');
			return _d.reject(err);
		}

		config.google.clientID = result.clientID;
		config.google.clientSecret = result.clientSecret;
		config.google.callbackURL = result.callbackURL;

		log.debug ({ config : config.google }, 'get');
		_d.resolve();
	});

	return _d.promise();  
}

/* Search for any entry with same combination of hostname
 * and authtype add only if not present. this avoids duplicacy
 */

function add (credential_obj)
{
	var _d = $.Deferred();

	if (!credential_obj) {
		_d.reject ('invalid input');
		return _d.promise();
	}

	var _cred = {
		hostName     : credential_obj.hostName,
		authType     : credential_obj.authType,
		clientID     : credential_obj.clientID,
		clientSecret : credential_obj.clientSecret,
		callbackURL  : credential_obj.callbackURL
	};


	var cred = new Credential(_cred);
	
	Credential.findOne({ 'hostName' : credential_obj.hostName, 'authType' : credential_obj.authType }, function (err, olduser) {

		if (err) {
			log.error ({ err : err, cred : _cred }, 'add error');
			return _d.reject(err);
		}

		if (olduser) {
			log.warn ({ cred : _cred }, 'duplicate entry');
			return _d.reject('duplicate entry');
		}

		/*
		 * All ij well. Add the entry */
		cred.save(function (err, done) {

			if (err) {
				log.error ({ err: err, cred : _cred }, 'save error');
				return _d.reject (err);
			}

			_d.resolve(done);
		});
	});

   return _d.promise();
}

/*
 * Remove entry from db corresponding to some specific host_name 
 * and auth_type 
 */ 
function remove (credential_obj) {
	var _d = $.Deferred();

	if (!credential_obj) {
		_d.reject ('invalid input');
		return _d.promise();
	}

	/* This is done to search for any entry with same combination of hostname
	   and authtype, remove if  present. this avoids duplicacy*/

	Credential.findOne({ 'hostName' : credential_obj.hostName, 'authType' : credential_obj.authType }, function (err, olduser) {
		if (err) {
			log.error ({ err : err, cred : credential_obj }, 'remove: find error');
			return _d.reject(err);
		}

		if (!olduser) {
			log.warn ({ cred : credential_obj }, 'remove: entry not found');
			return _d.reject ('not found');
		}

		var query = Credential.remove({ 'hostName' : credential_obj.hostName, 'authType' : credential_obj.authType }, function (err, results) {
			if (err) {
				log.error ({ err : err, cred : credential_obj }, 'remove error');
				return _d.reject(err);
			}

			return _d.resolve(results);
		});

	});

	return _d.promise();
}

var db = {};
db.get = get;
db.add  = add;
db.remove  = remove;
db.get_all = get_all;
module.exports = db;

