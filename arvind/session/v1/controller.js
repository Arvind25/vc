var $               = require("jquery-deferred");
var log             = require("./common/log").sub_module('controller');
var auth            = require("./auth");
var resources       = require("./resources");
var class_          = require("./class");
var protocol        = require("./protocol");
var users           = require("./users");
var addr            = require("./addr");
var connection      = require('./connection');

connection.events.on ('closed', function (vc_id) {
	handle_user_remove (vc_id);
});

class_.events.on ('active', function () {
	users.all_waiting ().forEach (function (user) {
		actually_join_user (user);
	});
});

controller = {};
controller.init = function (sess_info) {
	users.init (sess_info);
	class_.init (sess_info);
};

controller.process = function (conn, from, to, msg) {

	var _d = $.Deferred ();
	/*
	 * format of addresses (from/to):
	 * 		resourceA[:instanceA][resourceB[:instanceB]] ... */

	var _to = addr.inspect_top(to);

	switch (_to.resource) {

		case 'auth' :

			handle_new_user (_d, conn, from, msg);
			break;

		default :
			log.error ({ to:to.resource }, 'illegal to.resource');
			_d.reject ('illegal to.reource', 'controller');
			return _d.promise ();
	}

	return _d.promise ();
};

function handle_new_user (_d, conn, from, msg) {

	var user_info = null;
	/*
	 * 'auth' is the first PDU we get when a new user 
	 *  connects. */

	if (!users.can_admit ())
		return _d.reject ('class already packed to full quorum');

	if (!class_.ready ())
		return _d.reject ('not started', 'auth');

	try {
		user_info = auth.process (msg);
	}
	catch (err) {
		return _d.reject ({ code : 'auth-failed', msg : err });
	}

	if (!users.add_user (user_info, conn))
		return _d.reject ('कितनी बार आओगे ?', 'auth');

	if (!conn.set_user (user_info.vc_id)) {
		users.remove_user (user_info.vc_id);
		return _d.reject ('unable to assign user to connection', 'auth');
	}

	/*
	 * Send Ack */
	_d.resolve (user_info);

	if (class_.started()) {
		process.nextTick (actually_join_user.bind(null, user_info));
	}
}

function actually_join_user (user) {

//	users.mark_joined (user.vc_id);

	resources.init_user (user)
		.then (
			function (info) {
				users.mark_joined( user.vc_id);
				info.attendees = users.get_publishable_info (null, user.vc_id);
				users.send_info (user.vc_id, 'controller', 'framework', 'session-info', info);
				users.broadcast_info ('controller', 'framework', 'new-johnny', users.get_publishable_info(user.vc_id), user.vc_id);
			},
			/* resources.init should _not_ return an error */
			function (err) {
				log.error ({ err: err }, 'resources.init_user: error. This is not supposed to happen - indicates a bug in the code');
			}
		);
}

function handle_user_remove (vc_id) {
	users.remove_user (vc_id);
	users.broadcast_info ('controller', 'framework', 'johnny-go-went-gone', vc_id, vc_id);
}

module.exports = controller;
