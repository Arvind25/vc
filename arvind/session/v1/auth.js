var log             = require("./common/log").sub_module('auth');
var cipher          = require("./cipher");
var names           = require("./names");

auth = {};
auth.process = function (msg) {
	var auth_info = null;
	/* Decode the message
         it has to be decoded twice to get the JSON object because it comes
         through web socket and 'msg' being sent is the value in cookie i.e.
         once encoded by us in code and further uri encoded while in cookie.
         Verified this via logs but need a clearer picture, need to DISCUSS              WITH AVINASH */
	var payload1 = decodeURIComponent(msg);
        //var payload = cipher.decode ('auth', msg);
        payload = decodeURIComponent(payload1);
       // console.log('auth info ####################################### '+msg+ '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ '+payload1+'------------------------------------------------------------------------------------- '+payload);
        
        if (!payload) {
		log.warn ('auth: decode error');
		throw 'decode error';
	}

	try {
		auth_info = JSON.parse (payload);
	}
	catch (e) {
		log.warn ('auth: JSON Parse error: ' + e);
		throw 'decode error : ' + e.message;
	}

	/* Assign a unique ID and a nickname to the user */
	auth_info.vc_id = random_id ();
	auth_info.nickname = names ();

	return auth_info;
};

var seed = 1;
function random_id () {
	var str = '';
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 5; i++ )
	str += possible.charAt(Math.floor(Math.random() * possible.length));

	seed++;
	return str + seed;
}

module.exports = auth;
