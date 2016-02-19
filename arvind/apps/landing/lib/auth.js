var url = require('url');
var cipher = require('common/cipher');

var auth = {};

auth.authenticate = function (req, res, next) {

	var log = req.log;

	/*
	 * if the cookie 'wiziq_auth_landing' is set then 
	 *     1. Fetch from redis, using it's value as the key
	 *     2. If none, then the session expired --> redirect to auth gateway
	 *     3. Else set the value of user_info (redis value) into req.wiziq.user
	 *     4. Next
	 * Else check for 'wiziq_auth'.
	 * If absent then redirect to auth gateway.
	 * If present then:
	 *     1. Generate key (uuid)
	 *     1.1 Decode 'wiziq_auth' value
	 *     1.2 If unable to decode, then redirect to auth gateway
	 *     2. Store key <-> decoded wiziq_auth (which is, essentially, the user info) mapping in Redis
	 *           - with a timeout
	 *     3. Create cookie 'wiziq_auth_landing' and set it to 'key'
	 */

	/*
	 * For now, just implementing this:
	 *    1. If 'wiziq_auth' is not set --> redirect to (assuming local) auth gateway.
	 *    2. If set, then decode
	 *       2.1 If decode OK then --> set user_info in req.wiziq.user and next
	 *       2.2 If decode not-OK then --> show an auth error message
	 */

	log.info ({ module: 'auth', cookies : req.cookies });

	var wiziq_auth = req.cookies.wiziq_auth;
       // console.log('wiziq_auth *************** '+wiziq_auth+' '+req.cookies.wiziq_auth);
	if (!wiziq_auth) {

		var original_url = url.format({
		    protocol: req.protocol,
		    host: req.get('host'),
		    pathname: req.originalUrl
		  });

		res.cookie('wiziq_origin', original_url, {
			maxAge : 1000*60*60*24*7,    /* Expires in a long time */
			path   : '/',
			secure : true
		});

		var auth_via = req.wiziq.sess_config.auth.via;

		if (!auth_via)
			auth_via = [ 'anon' ];

		var auth_via_str = auth_via.reduce(function (prev, curr, index, arr) {
								if (!prev)
									return curr;
								return prev + ',' + curr;
							}, null);

		res.cookie('wiziq_auth_via', auth_via_str, {
			maxAge : 1000*60*60*24*7,    /* Expires in a long time */
			path   : '/',
			secure : true
		});

		res.set({ 'Referer' : original_url });
		return res.redirect('/auth/login');
	}

	var user_info;
	try {
	        user_info = cipher.decode (log, 'auth', wiziq_auth);
            }
	catch (e) {
		log.warn ({ module:'auth', error : e }, 'invalid cipher: decode error');
		return next(e);
	}

	if (!req.wiziq)
		req.wiziq = {};

	req.wiziq.user = user_info;

	next();
};

module.exports = auth;
