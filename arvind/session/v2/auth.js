var cipher          = require("./cipher");

auth = {};
auth.process = function (log_, msg) {
	var user_info = null;
	var log  = log_.child ({ module : 'auth' });

	var payload = cipher.decode (log_, 'auth', msg);

	if (!payload) {
		log.warn ('auth: decode error');
		throw 'decode error';
	}

	try {
		user_info = JSON.parse (payload);
	}
	catch (e) {
		log.warn ('auth: JSON Parse error: ' + e);
		throw 'decode error : ' + e.message;
	}

	return user_info;
};

module.exports = auth;
