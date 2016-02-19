var $               = require("jquery-deferred");
var log             = require("./common/log").sub_module('resources');
var config          = require("./config");
var users           = require("./users");
var addr            = require("./addr");

var list = {};
var res = {};

res.load = function (sess_info) {

	var _d        = $.Deferred ();
	var resources = sess_info.resources;
	var common    = sess_info.common;
	var counter   = resources.length;

	function mod_ok () {
		counter--;
		log.info ({ res: this }, 'module.init ok');
		if (!counter)
			finish();
	}

	function mod_err (err) {
		counter--;
		log.error ({ res: this, err: err }, 'module.init error');
		if (!counter)
			finish();
	}

	function finish () {
		_d.resolve ();
	}

	if (!resources) {
		log.error ({ sess_info : sess_info }, 'no resources defined');
		return;
	}

	for (var i = 0; i < resources.length; i++) {
		var r = resources[i];

		list[r.name] = {};

		/* Add additional utility handles */
		sess_info.handles = {};
		sess_info.handles.log = log.child({ res : r.name });
		sess_info.handles.coms = {};
		sess_info.handles.coms.broadcast_info = users.broadcast_info.bind (users, r.name, r.name);

		try {
			list[r.name].handle = require('./resources/' + r.name + '/main.js');
			list[r.name].handle.init (r, common, sess_info.handles)
				.then (mod_ok.bind(r.name), mod_err.bind(r.name));
		}
		catch (e) {
			mod_err.call(r.name, e);
			delete list[r.name];
		}
	}

	return _d.promise ();
};

res.init_user = function (user) {
	var _d        = $.Deferred ();
	var d_arr     = [];
	var info      = {};
	var info_err  = {};
	var counter   = Object.keys(list).length;

	function mod_ok (m, data) {
		info[m] = data;
		counter--;
		if (!counter)
			finish ();
	}

	function mod_err (m, err) {
		log.warn ({ res: m, err: err }, 'init_user error');
		info_err[m] = err;
		counter--;
		if (!counter)
			finish ();
	}

	function finish () {
		_d.resolve ({
			info : info,
			info_err : info_err
		});
	}

	for (var m in list) {
		if (list[m].handle.init_user) {
			var d_mod;

			try {
				d_mod = list[m].handle.init_user (user);
			}
			catch (e) {
				log.error ({ res: m, err: e }, 'init_user exception');
				counter--;
			}

			if (d_mod) {
				d_mod.then (
					mod_ok.bind(d_mod, m),
					mod_err.bind(d_mod, m)
				);
			}
		}
	}

	return _d.promise ();
};

res.route_info = function (from, to, msg) {
	if (!list[to]) {
		log.error ({ from: from, to: to, msg: msg }, 'route_info: to non-existent module');
		return;
	}

	if (!list[to].handle.info) {
		log.error ({ from: from, to: to, msg: msg }, 'route_info: undefined info method');
		return;
	}

	var user = addr.user(from);

	if (!user) {
		log.error ({ from: from, to: to, msg: msg }, 'route_info: unacceptable from address');
		return;
	}

	list[to].handle.info (user, msg.info_id, msg.info);
};

module.exports = res;
