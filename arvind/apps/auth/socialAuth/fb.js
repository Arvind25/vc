var $ = require('jquery-deferred');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./oauth.js');
var encodeFb = require('./encode.js');

var express          = require( 'express' );
var app              = express();
var server           = require( 'http' ).createServer( app ) ;
var path             = require('path');
var passport         = require( 'passport' );
var util             = require( 'util' );
var bodyParser       = require( 'body-parser' );
var cookieParser     = require( 'cookie-parser' );
var FacebookStrategy = require( 'passport-facebook' ).Strategy;
var args             = require('common/args');
var log              = require('auth/common/log');
var login            = require('auth/routes/login');
var db               = require('auth/models/db');


function passport_use_facebook_strategy ()
{
	var _d = $.Deferred();
	passport.use(new FacebookStrategy({
			clientID: config.facebook.clientID,
			clientSecret: config.facebook.clientSecret,
			callbackURL: config.facebook.callbackURL
		},
		function(accessToken, refreshToken, profile, done) {
			process.nextTick(function () {
			return done(null, profile);
			});
		}	
	));
	_d.resolve();
	return _d.promise();
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
		done(null, user);
		});

passport.deserializeUser(function(obj, done) {
		done(null, obj);
		});


app.get('/account', ensureAuthenticated, function(req, res){
		var origin = req.cookies.wiziq_origin;
		var MAX_SIZE_COOKIE = 4096;
		/* read cookie and maybe remove this cookie as it is needed no more */
		log.info(req.user, 'facebook user info');
		console.log('wiziq origin cookie '+origin+' '+req.cookies.wiziq_origin);
		if( origin){
			var info = {
				/* all the required fields goes here.. for now just sending the whole payload */
				user : req.user
			};
			//fetch all the necessary info from user/info
			var user_identity =  encodeFb.getUserDetails(req.user);
			var auth_string = JSON.stringify(user_identity);
			console.log('buffer length  '+Buffer.byteLength( auth_string ));
			if( Buffer.byteLength( auth_string ) > MAX_SIZE_COOKIE ){
				auth_string = "error: size_limit_exceeded";
			}	
			// auth_string = new Buffer( JSON.stringify( auth_string)).toString('base64');
			auth_string = encodeURIComponent(auth_string);
			res.cookie('wiziq_auth' , auth_string );
			res.redirect( origin);
		}
		else{
			res.send('cookie origin???: ' + origin);
		}	
});


//app.use('/login', login);


// GET /
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/',
	    fetch_data_from_db,
		passport_init('facebook'),
	   	passport.authenticate('facebook',
							   function(req, res) {}
							 )
	   );


function passport_init(auth_type){
	return  function(req, res, next) {
		if(auth_type == 'facebook')
		{
			passport_use_facebook_strategy()
				.then(next,function fail( err){
						console.log("Error in facebook strategy usage "+err);
						return res.redirect('/auth/login');
						});
		}

	};
}


function fetch_data_from_db(req,res,next)
{
	db.get('facebook',req,res)
		.then(
				next, function fail( err){
				return res.redirect('/auth/login');
				});
}




// GET google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/callback',
		passport.authenticate( 'facebook',
							   {
							   		successRedirect: '/auth/auth/fb/account',
									failureRedirect: '/auth/login',
									failureFlash: 'Invalid username or password.'
							   }
							 )
	   );

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('login');
}


module.exports = app;


