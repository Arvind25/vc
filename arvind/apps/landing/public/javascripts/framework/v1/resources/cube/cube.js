define(function(require) {
	var $           = require('jquery');
	var jmenu       = require('jquery_mmenu');
	window.jade     = require('jade');
	var log         = require('log')('cube', 'info');
	var events      = require('events');
	var framework   = require('framework');

	var cube = {};
	var f_handle = framework.handle ('cube');

	cube.init = function (display_spec, custom, perms) {
		var _d = $.Deferred();
		var anchor = display_spec.anchor;
		var template = f_handle.template('cube');

		if (!template) {
			_d.reject ('template \"cube\" not found');
			return _d.promise ();
		}

		$('body').append(template());

		/* Attach a click handler */
		$('.wrap').on('click', toggle);

		create_menu (f_handle);

		_d.resolve();
		return _d.promise();
	};

	cube.start = function (sess_info) {
	};

	cube.info = function (from, id, data) {
	};

	function create_menu (f) {
		var _m = f.menu;

		_m.add ('About', 'about');
		_m.add ('Expand', 'about.expand');
		_m.add ('Shrink', 'about.shrink');
		_m.handler (menu_handler);
	}

	function toggle () {
		if ($('.wrap.center').length === 0) {
			$('.wrap').addClass('center');
			return;
		}

		$('.wrap').removeClass('center');
		return;
	}

	function menu_handler (menu_uid) {
		switch (menu_uid) {
			case 'about.expand':
				$('.wrap').addClass('center');
				break;
			case 'about.shrink':
				$('.wrap').removeClass('center');
				break;
		}
	}

	return cube;
});
