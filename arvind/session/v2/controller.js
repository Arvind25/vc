var $               = require("jquery-deferred");
var mylog           = require("./common/log").sub_module('controller');
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
	var list = users.passive_attendees ();

	for (var u in list)
		actually_join_user (list[u].user);
});

resources.events.on ('resource-allocated', function (data) {
	var vc_id  = data.vc_id;
	var mod    = data.mod;
	var status = data.status;
	var info   = data.info;

	users.set_resource_info (vc_id, mod, status, info);
});

controller = {};
controller.init = function (sess_info) {
	users.init (sess_info);
	class_.init (sess_info);
};

controller.process = function (conn, from, to, msg) {
	var _d = $.Deferred ();
	var log_ = conn.c.log;
	var log  = log_.child ({ module : 'controller' });

	/*
	 * format of addresses (from/to):
	 * 		resourceA[:instanceA][resourceB[:instanceB]] ... */

	var _to = addr.inspect_top(to);

	switch (_to.resource) {

		case 'auth' :

			handle_new_user (_d, conn, from, msg, log_);
			break;

		default :
			log.error ({ to:to.resource }, 'illegal to.resource');
			_d.reject ('illegal to.reource', 'controller');
			return _d.promise ();
	}

	return _d.promise ();
};

function handle_new_user (_d, conn, from, msg, log_) {

	var in_user_info = null;

	/*
	 * 'auth' is the first PDU we get when a new user 
	 *  connects. */

	if (!users.can_admit (log_))
		return _d.reject ('class already packed to full quorum');

	try {
		in_user_info = auth.process (log_, msg);
	}
	catch (err) {
		return _d.reject ({ code : 'auth-failed', msg : err });
	}

	var user_info = users.add_user (in_user_info, conn);

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

	users.activate (user.vc_id);

	var sess_info = {
		attendees : users.get_publishable_info (null, user.vc_id),
	};

	users.send_info (user.vc_id, 'controller', 'framework', 'session-info', sess_info);
	users.broadcast_info ('controller', 'framework', 'new-johnny', users.get_publishable_info(user.vc_id), user.vc_id);

	/*
	 * Set the ball rolling for resources init for the specific user. The per-resource
	 * information will be sent as and when it is allocated by the resources */
	resources.init_user (user, users.get_resources(user.vc_id), users.get_log_handle (user.vc_id));
}

function handle_user_remove (vc_id) {
	users.remove_user (vc_id);
	users.broadcast_info ('controller', 'framework', 'johnny-go-went-gone', vc_id, vc_id);
}

module.exports = controller;
