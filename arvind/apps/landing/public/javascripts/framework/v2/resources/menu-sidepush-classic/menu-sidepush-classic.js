define(function(require) {
	var $           = require('jquery');
	var jmenu       = require('jquery_mmenu');
	window.jade     = require('jade');
	var log         = require('log')('menu-sidepush-v1', 'info');
	var framework   = require('framework');

	var msp = {};
	var top;
	var f_handle = framework.handle ('menu-sidepush-v1');

	msp.init = function (display_spec, custom, perms) {
		var _d = $.Deferred();
		var anchor = display_spec.anchor;

		top = $('nav#menu-side ul');

		/* jquery mmenu does not allow addition of menu items 
		 * at runtime (after it's initialization). Hence, we initialize
		 * the mmenu itself in the 'start' method, assuming that all
		 * the modules have, by then, registered their menu items. TODO:
		 * do something about being able to add meny items dynamically
		 * at any time. */

		_d.resolve();
		return _d.promise();
	};

	var callback_handle;

	msp.start = function (sess_info) {
		$('nav#menu-side').mmenu({
			extensions: ["pagedim-black", "effect-listitems-drop"],
			offCanvas: {
				position  : "right",
				zposition : "next"
			}
		});

		/* Attach a click handler to the burger */
		var h = $('nav#menu-side').data('mmenu');
		$('a#vc-menu').on('click', function () {
			h.open();
		});

		/* Attach a click handler to the overall menu */
		$('nav#menu-side').on('click', 'li a.menu-leaf', function (e) {

			if (!callback_handle) {
				log.error ('error : undefined callback handler');
				return;
			}
			return callback_handle($(e.target).attr('id'));
		});

	};

	msp.info = function (from, id, data) {
	};

	/*
	 * Since this resource's role is 'menu', add the mandatory 
	 * methods */

	var map = {};

	msp.menu_add = function (display, path, uid) {
		var curr = top;
		var p = [];

		if (path !== '')
			p = path.split('.');

		for (var i = 0; i < p.length; i++) {
			var _c = curr.children('li#li-' + p[i]);

			if (!_c || !_c[0]) {
				log.error ('menu_add: error: parent dom node \"li#li-' + p[i] + '\" not found');
				return false;
			}

			var li = _c[0];
			$(li).children('a').removeClass('menu-leaf');
			var _ul = $($(li).children('ul'));
			if (_ul.length === 0) {
				$(li).append('<ul></ul>');
				_ul = $($(li).children('ul'));
			}

			curr = $(_ul[0]);
		}

		/* The 'curr' should now point to the terminal containing
		 * 'ul' element. The new leaf node should be added here. */

		curr.append('<li id="li-' + uid + '"></li>');
		$(curr.find('li#li-' + uid)[0]).append('<a id="' + uid + '" class="menu-leaf" href="#">' + display + '</a>');

		return true;
	};

	msp.menu_remove = function (display, id) {
	};

	msp.menu_set_handler = function (f) {
		callback_handle = f;
	};

	return msp;
});
