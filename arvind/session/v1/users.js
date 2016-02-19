var log             = require("./common/log").sub_module('users');
var config          = require("./config");
var addr            = require("./addr");

var list_active = {};
var list_removed = {};
var users = {};
/*
 * If max_attendees is zero, this value is treated as impliying potentially 
 * unlimited number of attendees. We set this as the default */
var max_attendees = 0;
var curr_attendees = 0;

users.init = function (sess_info) {
	if (sess_info.max_attendees)
		max_attendees = sess_info.max_attendees;
};

users.can_admit = function () {
	if (!max_attendees)
		return true;

	return curr_attendees < max_attendees;
};

users.add_user = function (user_info, conn) {
	var vc_id = user_info.vc_id;

	if (list_active[vc_id])
		return false;

	list_active[vc_id] = {};
	list_active[vc_id].user = user_info;
	list_active[vc_id].conn = conn;
	list_active[vc_id].state = 'waiting';
	curr_attendees++;

	log.info ({ vc_id : vc_id, info : user_info, attendees : curr_attendees }, 'user added');
	return true;
};

users.remove_user = function (vc_id) {
	if (!list_active[vc_id])
		return false;

	list_removed[vc_id] = {
		user : list_active[vc_id].user
	};

	delete list_active[vc_id];
	curr_attendees--;

	log.info ({ vc_id: vc_id, attendees : curr_attendees }, 'user removed');

	return true;
};

users.mark_joined = function (vc_id) {
	if (!list_active[vc_id]) {
		log.error ({ vc_id: vc_id }, 'mark_joined: user not in active list');
		return;
	}

	list_active[vc_id].state = 'in-session';
};

users.all_waiting = function () {
	var arr = [];

	for (var u in list_active) {
		if (list_active[u].state === 'waiting')
			arr.push(list_active[u].user);
	}

	return arr;
};

users.send_info = function (vc_id, from, to, info_id, info) {
	var _u = list_active[vc_id];

	if (!_u) {
		log.error ({ vc_id: vc_id, from:from, to:to, info_id:info_id, info:info }, 'send_info: user not in active list');
		return;
	}

	if (!joined(_u)) {
		log.warn ({ vc_id: vc_id, from:from, to:to, info_id:info_id, info:info }, 'send_info: not sent. Reason : not active');
		return;
	}

	var conn = _u.conn;
	conn.send_info (from, addr.prepend(to, 'user', vc_id), info_id, info);
};


users.broadcast_info = function (from, to, info_id, info, except) {
	var list = [];

	for (var u in list_active) {
		var _user = list_active[u].user;
		var _conn = list_active[u].conn;

		if (except)
			if (_user.vc_id == except)
				continue;

		if (!joined(list_active[u]))
			continue;

		var _to = addr.prepend (to, 'user', _user.vc_id);
		_conn.send_info (from, _to, info_id, info);
	}
};

users.get_publishable_info = function (vc_id, exclude) {

	if (vc_id) {

		if (!list_active[vc_id]) {
			return {
				vc_id : vc_id,
				displayName : '--error-inactive--',
			};
		}
		return [ publishable_info(list_active[vc_id].user) ];
	}

	var info = [];
	for (var id in list_active)
		if (id != exclude && joined( list_active[id]) )				/* -changed by pawan */
			info.push (publishable_info (list_active[id].user));

	return info;
};

function publishable_info (user_info) {
	/* Return the full thing for now - but some infromtaion shoudlbe held back 
	 * from a privacy point of view */
	return user_info;
}

function joined (user) {
	if (user.state === 'in-session')
		return true;
	
	return false;
}

module.exports = users;
