var $               = require("jquery-deferred");
var mylog           = require("./common/log").sub_module('resources');
var config          = require("./config");
var users           = require("./users");
var addr            = require("./addr");
var ev              = require("./events")('resources');

var list = {};
var res = {};

res.events = ev;

res.load = function (sess_info) {

	var _d        = $.Deferred ();
	var resources = sess_info.resources;
	var common    = sess_info.common;
	var counter   = resources.length;

	function mod_ok () {
		counter--;
		mylog.info ({ res: this }, 'module.init ok');
		if (!counter)
			finish();
	}

	function mod_err (err) {
		counter--;
		mylog.error ({ res: this, err: err }, 'module.init error');
		if (!counter)
			finish();
	}

	function finish () {
		_d.resolve ();
	}

	if (!resources) {
		mylog.error ({ sess_info : sess_info }, 'no resources defined');
		return;
	}

	for (var i = 0; i < resources.length; i++) {
		var r = resources[i];

		list[r.name] = {};

		/* Add additional utility handles */
		sess_info.handles = {};
		sess_info.handles.log = mylog.child({ res : r.name });
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

res.init_user = function (user, res_info_saved, log_handle) {

	for (var m in list) {
		if (list[m].handle.init_user) {
			var d_mod;

			try {
				var last_info = null;

				if (res_info_saved[m] && res_info_saved[m].status === 'ok')
					last_info = res_info_saved[m].info;

				d_mod = list[m].handle.init_user (user, last_info, log_handle.child({ res : m }));
			}
			catch (e) {
				mylog.error ({ res: m, err: e }, 'init_user exception');
			}

			if (d_mod) {
				d_mod.then (
					publish_res_info.bind (d_mod, user, m, 'ok'),
					publish_res_info.bind (d_mod, user, m, 'error')
				);
			}
		}
	}
};

function publish_res_info (user, mod, status, info) {
	ev.emit ('resource-allocated', {
		vc_id : user.vc_id,
		mod   : mod,
		status: status,
		info  : info
	});
}

res.route_info = function (from, to, msg) {
	mylog.info(from + "::" + to +'::'+msg);
	if (!list[to]) {
		mylog.error ({ from: from, to: to, msg: msg }, 'route_info: to non-existent module');
		return;
	}

	if (!list[to].handle.info) {
		mylog.error ({ from: from, to: to, msg: msg }, 'route_info: undefined info method');
		return;
	}

	var user = addr.user(from);

	if (!user) {
		mylog.error ({ from: from, to: to, msg: msg }, 'route_info: unacceptable from address');
		return;
	}

	list[to].handle.info (user, msg.info_id, msg.info);
};

module.exports = res;
