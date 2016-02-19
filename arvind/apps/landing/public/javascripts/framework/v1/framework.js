define(function(require) {
	var $         = require('jquery');
	var cc        = require('cc');
	var lc        = require('layout-controller');
	var identity  = require('identity');
	var events    = require('events');
	var notify    = require('notify');
	var attendees = require('attendees');
	var log       = require('log')('framework', 'info');

	var framework     = {};
	var modules       = {};
	var menu_handle   = {};
	var progress_ev   = events.emitter ('framework-progress', 'framework');

	framework.init = function (sess_config) {
		var _d = $.Deferred();

		log.log ('init called with ', sess_config);

		lc.init(sess_config, framework);
		lc.probe_layout();

		_d.resolve(sess_config);

		return _d.promise();
	};

	framework.init_modules = function (_module) {
		var err = '';
		var _d = $.Deferred();

		if (modules[_module.name]) {
			log.error ('Duplicate module for init: ' + _module.name);
			_d.reject('Duplicate module' + _module.name);
			return _d.promise ();
		}

		modules[_module.name] = _module;

		log.info ('inserting module - ' + _module.name + ' ...');

		if ((err = lc.attach_module (_module)) !== null) {

			log.error ('Failed to attach module ' + _module.name);

			_d.reject (err);
			return _d.promise ();
		}

		var _d_mod = _module.handle.init (
			_module.resource.display_spec,
			_module.resource.custom,
			_module.resource.perms
		);

		_d_mod.then (
			function() {
				modules[_module.name] = _module;
				set_role (_module);
				progress_ev.emit ('init ' + _module.name + ' ok');
				_d.resolve (_module);
			},
			function (err) {
				log.error ('init failed for \"' + _module.name + '\" : err = ' + err);
				progress_ev.emit ('init ' + _module.name + ' failed');
				_d.reject(err);
				return;
			}
		);

		return _d.promise();
	};

	framework.start_module = function (session_info, _module) {
		var name = _module.name;

		if (!_module.handle.start) {
			log.error ('module \"' + name + '\": \"start\" method undefined');
			return;
		}

		if (!session_info.info[name])
			log.log ('module \"' + name + '\": session info not defined');

		log.info ('starting module \"' + name + '\" ...');

		try { 
			_module.handle.start (session_info.info[name], session_info); 
			progress_ev.emit ('start ' + _module.name + ' ok');
		}
		catch (e) {
			log.error ('module \"' + name + '\": start err = ' + e);
			progress_ev.emit ('start ' + _module.name + ' failed');
		}
	};

	/*
	 * Do any work which needs to be done, once all the modules
	 * have finished their inits. */
	framework.post_init = function (sess_info) {
		var _d = $.Deferred ();

		lc.post_init ();

		_d.resolve (sess_info);
		return _d.promise ();
	};

	var _d_start;
	framework.wait_for_start = function () {
		_d_start = $.Deferred ();

		log.info ('waiting for go-ahead from session cluster ...');
		progress_ev.emit ('waiting for session cluster ...');
		/*
		 * Nothing to be done here, except when we recieve the 
		 * message from the session controller. We trigger this
		 * promise then. */

		return _d_start.promise ();
	};

	function started (sess_info) {
		log.info ('class started : ', sess_info);
		progress_ev.emit ('session cluster responded with session info');
		_d_start.resolve (sess_info);
	}

	/*
	 * Called by the CC module to deliver an incoming req.
	 * Should return a promise. */

	framework.rx_req = function (message) {
		var module_name = message.to.split(':')[1];
		var instance    = message.to.split(':')[2];
		var _d = $.Deferred ();

		if (module_name === 'framework') {
			handle_req (_d, message);
			return _d.promise ();
		}

		if (!modules[module_name]) {
			_d.reject ('module (' + module_name + ') not registered');
			return _d.promise ();
		}

		/* TODO : do check for instance */

		modules[module_name].handle.remote_req (message.msg)
			.then (
				_d.resolve.bind(_d),
				_d.reject.bind(_d)
			);

		return _d.promise ();
	};

	framework.rx_info = function (from, to, id, data) {

		switch (to) {
			case 'framework' :
				switch (id) {

					case 'session-info': 
						attendees.fill_users(data.attendees);
						started (data); 
						break;

					case 'new-johnny':
						attendees.user_join( data);
						break;

					case 'johnny-go-went-gone':
						attendees.user_leave( data);
						break;

					default :
						log.error ('handler for info \"' + id + '\" NOT IMPLEMENTED (to: ' + to + ')');
				}
				break;

			default :
				deliver_info (from, to, id, data);
		}
	};

	framework.handle = function (module_name) {

		var handle = {
			identity       : identity,
			attendees      : attendees.api,
			module_name    : module_name,
			send_command   : send_command,
			send_info      : send_info,
			template       : template,
			notify         : notify,
			menu           : {
				module_name : module_name,
				add         : menu_add,
				remove      : menu_remove,
				handler     : menu_handler,
			}
		};

		return handle;
	};

	/*---------------------------------------------
	 * Internal functions
	 *--------------------------------------------*/


	function menu_add (display, path) {
		if (!menu_handle.add) {
			log.error ('No registered menu resource: ' + this.module_name + '.menu.add() failed');
			return false;
		}

		var uid = uniq_id (path);

		/* 'path' is of the form "a.b.c", where "c" is to be added under
		 * "a"->"b". Implies, that "a" & "b" must exist. */
		if (!create_menu_map(uid, this.module_name, display, path))
			return false;

		if (!create_menu_reverse_map(uid, this.module_name, display, path))
			return false;

		return menu_handle.add (display, get_path(this.module_name, path), uid);
	}

	var __seed = 1;
	var menu_map = {};
	var menu_rmap = {};
	function uniq_id (path) {
		var _s = path.split('.');
		__seed++;
		return 'menu-' + _s[_s.length -1] + '-' + __seed;
	}

	function get_path (_m_name, path) {
		var _m = menu_map[_m_name].submenu;
		var _s = path.split('.');
		var _path = '';

		for (var i = 0; i < _s.length - 1; i++) {
			_path += _m[_s[i]].uid;

			if (i < _s.length - 2)
				_path += '.';

			_m = _m[_s[i]].submenu;
		}

		return _path;
	}

	function create_menu_map (uid, _m_name, display, path) {
		if (!menu_map[_m_name])
			menu_map[_m_name] = {
					module  : _m_name,
					submenu : {},
					handler : null,
				};

		var _m = menu_map[_m_name].submenu;
		var _s = path.split('.');

		for (var i = 0; i < _s.length; i++) {

			if (i == (_s.length - 1)) {
				_m[_s[i]] = {
					display : display,
					uid     : uid,
					submenu : {}
				};
				return true;
			}

			if (!_m[_s[i]]) {
				log.error ('create_menu_map: error: parent node \"' + _s[i] + '\" not defined for menu path \"' + path + '\", module (' + _m_name + ')');
				return false;
			}

			_m = _m[_s[i]].submenu;
		}

		/* Should never return from here */
		return false;
	}

	function create_menu_reverse_map (uniq_id, _m_name, display, path) {
		if (menu_rmap[uniq_id]) {
			log.error ('create_menu_reverse_map: internal error: duplicate uniq_id \"' + uniq_id + '\"');
			dump_all_uids ();
			return false;
		}

		menu_rmap[uniq_id] = {
			module_name : _m_name,
			path        : path
		};

		return true;
	}

	function dump_all_uids () {
		for (var key in menu_rmap) {
			log.info ('uid: ' + menu_rmap[key] + '[' + menu_rmap[key].module_name + '] - ' + menu_rmap[key].path);
		}
	}

	function menu_remove (display, path) {
		/* TODO
		if (!menu_handle.set_handler) {
			log.error ('No registered menu resource: ' + this.module_name + '.menu.remove() failed');
			return;
		}

		return menu_handle.remove (menu_callback.bind(this, f));
		*/
	}

	function menu_handler (f) {
		if (!menu_map[this.module_name]) {
			log.error ('menu_handler: error: no menu registered for \"' + this.module_name + '\"');
			return false;
		}

		menu_map[this.module_name].handler = f;

		return true;
	}

	/*
	 * returns a promise
	 */
	function send_command (user, sub_resource, op) {
		var _d      = $.Deferred ();

		var to = 'user:' + user + '.resource:' + this.module_name;
		cc.send_command (to, sub_resource, op, this.module_name)
			.then (
				_d.resolve.bind(_d),
				_d.reject.bind(_d)
			);


		return _d.promise();
	}

	function template (name) {
		if (!_templates[this.module_name] || !_templates[this.module_name][name])
			return null;

		/* jslint evil: true */
		var _t = new Function('locals', 'return ' + _templates[this.module_name][name]);

		return _t();
	}

	function send_info (user, info_id, data, from_instance) {

		var module_suffix = '.' + this.module_name + ':' + (from_instance? from_instance: '0');

		/*
		 * if user is null or empty, the intended recipient is
		 * the server counterpart of the module. */

		to = (!user || user.length === 0) ?
			this.module_name :
			'user:' + user + module_suffix;

		var from = 'user:' + identity.vc_id + module_suffix;

		cc.send_info (from, to, info_id, data);

		return;
	}

	function set_role (_module) {
		var role = _module.resource.role;

		if (!role)
			return;

		switch (role) {
			case 'menu':
				set_role_menu (_module);
				break;

			case 'av':
				break;

			case 'whitelabeling':
				break;

			default:
				log.error ('unknown role \"' + role + '\" for module \"' + _module.name + '\"');
		}

		return;
	}

	function set_role_menu (_module) {
		/*
		 * Test for various required methods */

		if (!_module.handle.menu_add) {
			log.error ('Undefined method \"menu_add\" for \"' + _module.name + '\" (role=menu)');
			return;
		}

		if (!_module.handle.menu_remove) {
			log.error ('Undefined method \"menu_remove\" for \"' + _module.name + '\" (role=menu)');
			return;
		}

		if (!_module.handle.menu_set_handler) {
			log.error ('Undefined method \"menu_set_handler\" for \"' + _module.name + '\" (role=menu)');
			return;
		}

		menu_handle.add = _module.handle.menu_add;
		menu_handle.remove = _module.handle.menu_remove;
		_module.handle.menu_set_handler(menu_callback);

		return;
	}

	function menu_callback (menu_uid) {

		if (!menu_rmap[menu_uid]) {
			log.error ('menu_callback with nonexistent uid: ' + menu_uid);
			return;
		}

		var module_name = menu_rmap[menu_uid].module_name;
		var path = menu_rmap[menu_uid].path;
		var f = menu_map[module_name].handler;

		try {
			f(path);
		}
		catch (e) {
			log.error ('menu_callback: exception in module \"' + module_name + '\", handling \"' + path + '\"');
		}
	}

	function deliver_info (from, to, id, data) {
		if (!modules[to]) {
			log.error ('deliver_info: unknown module \"' + to + '\"');
			return;
		}

		try {
			modules[to].handle.info (from, id, data);
		}
		catch (e) {
			log.error ('deliver_info: \"' + to + '\" err = ' + e);
		}
	}

	return framework;
});
