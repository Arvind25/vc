define(function(require) {
	var $           = require('jquery');
	window.jade     = require('jade');
	var log         = require('log')('av-main-v2', 'info');
	var framework   = require('framework');
	var session     = require('./session');
	var layout      = require('./layout');
	var screenshare = require('./screenshare');
	var menu        = require('./menu');
	var cpool       = require('./container-pool');

	var av = {};
	var f_handle = framework.handle ('av-tokbox-v2');

	av.init = function (display_spec, custom, perms) {
		var _d = $.Deferred();

		/*
		 * Initialize the layout */
		var err = layout.init (f_handle, display_spec, custom, perms);
		if (err) {
			_d.reject (err);
			return _d.promise ();
		}

		/*
		 * Initialize the session controller */
		err = session.init ();
		if (err) {
			_d.reject (err);
			return _d.promise ();
		}

		menu.init (f_handle, custom);
		cpool.init (f_handle, display_spec, custom, perms);

		/*
		 * Initialize the screenshare controller */
		err = screenshare.init (f_handle, custom);
		if (err) {
			_d.reject (err);
			return _d.promise ();
		}

		_d.resolve();
		return _d.promise();
	};

	av.start = function (sess_info) {
		return session.start (f_handle, sess_info);
	};

	av.info = function (from, id, data) {
	};

	return av;

});
