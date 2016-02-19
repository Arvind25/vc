var mylog           = require("./common/log").sub_module('users');
var config          = require("./config");
var addr            = require("./addr");
var names           = require("./names");

var list_passive = {};
var list_active = {};
var users = {};
var map = {};

/*
 * If max_attendees is zero, this value is treated as impliying potentially 
 * unlimited number of attendees. We set this as the default */
var max_attendees = 0;
var curr_attendees = 0;

users.init = function (sess_info) {
	if (sess_info.max_attendees)
		max_attendees = sess_info.max_attendees;

	mylog.info ({ max_attendees : max_attendees }, 'setting max attendees');
};

users.can_admit = function (log_) {
	if (!max_attendees)
		return true;

	return curr_attendees < max_attendees;
};

users.add_user = function (user_info, conn) {
	/*
	 * Passive join */

	var vc_id;
	var user_key = make_key (user_info);

	/*
	 * If we don't have this user in our map then he is a new user */
	if (!map[user_key]) {
		map[user_key] = {
			info : user_info,
			internal : {
				resources : {},
			}
		};
		map[user_key].info.history = [];
	}

	var entry = map[user_key].info;

	if (!entry.vc_id) {
		/* First time user - assign a unique ID and a nickname to the user */
		vc_id          = random_id ();
		entry.vc_id    = vc_id;
		entry.nickname = names ();
	}

	vc_id = entry.vc_id;
	var log = conn.log_handle().child({ vc_id : vc_id });

	/* Add a join time to the history of the user */
	entry.history.push ({
		'joined' : (new Date()).toISOString()
	});

	if (list_passive[vc_id]) {
		/*
		 * Just a sanity check - this user shouldn't already exist in the
		 * passive list - if he does our logic is inconsistent somewhere.
		 * Flag it */
		log.error ({ vc_id : vc_id, entry : list_passive[vc_id] }, 'user already exists in the passive list. overwriting');
	}

	list_passive[vc_id] = {
		user       : entry,
		user_key   : user_key,
		conn       : conn,
		state      : 'waiting',
		log_handle : log,
	};

	curr_attendees++;

	log.info ({ vc_id : vc_id, info : entry, attendees : curr_attendees }, 'user added');
	return entry;
};

users.remove_user = function (vc_id) {
	var list = null;

	/* 
	 * The user can either be in the active or the passive list */
	if (list_passive[vc_id])
		list = list_passive;

	if (list_active[vc_id])
		list = list_active;

	if (!list) {
		/*
		 * This shouldn't happen - indicates a bug somewhere */
		mylog.error ({ vc_id: vc_id }, 'remove user error : not found');
		return false;
	}

	var entry = list[vc_id].user;
	var log = list[vc_id].log_handle;

	/* Add a leaving time to the history of the user */
	entry.history.push ({
		'removed' : (new Date()).toISOString()
	});

	delete list[vc_id];
	curr_attendees--;

	log.info ({ vc_id: vc_id, attendees : curr_attendees }, 'user removed');

	return true;
};

users.activate = function (vc_id) {

	if (list_active[vc_id]) {
		/* Shouldn't happen - indicates a bug */
		mylog.error ({ vc_id: vc_id }, 'activate: user already in active list');
		return;
	}

	if (!list_passive[vc_id]) {
		/* Could happen, if the user is removed before he is able to join. May
		 * happen due to disconnection or voluntary action */
		mylog.warn ({ vc_id: vc_id }, 'activate: user not in passive list');
		return;
	}

	list_active[vc_id]       = list_passive[vc_id];
	list_active[vc_id].state = 'in-session';
	delete list_passive[vc_id];
};

users.get_resources = function (vc_id) {

	if (!list_active[vc_id]) {
		/* Shouldn't happen - indicates a bug */
		mylog.error ({ vc_id: vc_id }, 'get_resources: user not in active list');
		return {};
	}

	var user_key = list_active[vc_id].user_key;
	var resources = map[user_key].internal.resources;

	return resources;
};

users.get_log_handle = function (vc_id) {

	if (!list_active[vc_id]) {
		/* Shouldn't happen - indicates a bug */
		mylog.error ({ vc_id: vc_id }, 'get_resources: user not in active list');
		return mylog;
	}

	return list_active[vc_id].log_handle;
};

users.set_resource_info = function (vc_id, mod, status, info) {

	if (!list_active[vc_id]) {
		/* Shouldn't happen - indicates a bug */
		mylog.error ({ vc_id: vc_id }, 'set_resource_info: user not in active list');
		return ;
	}

	var user_key = list_active[vc_id].user_key;
	var resources = map[user_key].internal.resources;

	if (!resources[mod])
		resources[mod] = {};

	resources[mod].status = status;
	resources[mod].info   = info;
	resources[mod].name   = mod;

	users.send_info (vc_id, 'user-controller', 'framework', 'resource-init', resources[mod]);
	return ;
};

users.passive_attendees = function () {
	return list_passive;
};

users.send_info = function (vc_id, from, to, info_id, info) {
	var _u = list_active[vc_id];

	if (!_u) {
		/* Could happen due to early disconnection etc */
		mylog.warn ({ vc_id: vc_id, from:from, to:to, info_id:info_id, info:info }, 'send_info: user not in active list');
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
		if (id != exclude)
			info.push (publishable_info (list_active[id].user));

	return info;
};

function publishable_info (user_info) {
	/* Return the full thing for now - eventually some infromtaion coudl be held back 
	 * from a privacy point of view */
	return user_info;
}

var seed = 1;
function random_id () {
	var str = '';
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 5; i++ )
	str += possible.charAt(Math.floor(Math.random() * possible.length));

	seed++;
	return str + seed;
}

function make_key (user_info) {
	return user_info.id + ':' + user_info.displayName;
}

module.exports = users;
