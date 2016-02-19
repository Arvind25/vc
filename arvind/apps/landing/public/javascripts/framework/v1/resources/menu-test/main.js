define(function(require) {
	var $           = require('jquery');
	window.jade     = require('jade');
	var jquery_drag = require('jquery_drag');
	var log         = require('log')('menu_test', 'info');
	var framework   = require('framework');

	var menu_test = {};
	var f_handle = framework.handle ('menu-test');

	menu_test.init = function (display_spec, custom, perms) {
		var _d = $.Deferred();

		var anchor = display_spec.anchor;
		var template = f_handle.template('menu-01');

		if (!template) {
			_d.reject ('menu_test: template not found');
			return _d.promise ();
		}
		$(anchor).append(template({
			id : 'menu-01',
			title : 'mamamenutest',
			glyph_collapsed : 'fa-angle-double-up',
			glyph_expanded  : 'fa-angle-double-down'
		}));
		var menu_anchor = $(anchor).find('.vc-menu .menu-content ul')[0];

		/*
		var glyph = '<span id="menu-test" class="fa fa-angle-double-up"></span>';
		$(anchor).append(glyph);
		var menu_anchor = $(anchor).find('#menu-test')[0];
		*/

		make_menu (menu_anchor);

		_d.resolve();
		return _d.promise();
	};

	function make_menu (anchor) {
		menu_add (anchor, null, 'value-01', 'First Item', function (val) {
			log.info ('menu callback: val = ' + val);
		});
		menu_add (anchor, null, 'value-02', 'Second Item', function (val) {
			log.info ('menu callback: val = ' + val);
		});
		menu_add (anchor, null, 'value-03', 'Third Item', function (val) {
			log.info ('menu callback: val = ' + val);
		});
	}

	function menu_add (anchor, parent, val, name, callback) {
		var li = '<li class="vc-menu-li">' + name + '</li>';
		$(anchor).append(li);
	}

	menu_test.start = function (sess_info) {
	};

	menu_test.info = function (from, id, data) {
	};

	return menu_test;
});
