define(function(require) {
	var log = require('log')('identity', 'info');

	/*
	 * The '_identity' is set in views/.../vc-frame.jade, as a part of the
	 * HTML */
	var identity = _identity;

	/*
	 * The above variable is set only if we were authenticated, which implies
	 * that we must have the wiziq_auth context stored in our cookie. Save it.
	 */
	identity.secret = get_cookie('wiziq_auth');

	identity.set_info = function (user_info) {
		identity.vc_id = user_info.vc_id;
		identity.nickname = user_info.nickname;
		identity.displayName = user_info.displayName;
		identity.full_user_info = user_info;
	};

	function get_cookie (name) {
	  var value = "; " + document.cookie;
	  var parts = value.split("; " + name + "=");
	  if (parts.length == 2) return parts.pop().split(";").shift();
	}

	return identity;
});
