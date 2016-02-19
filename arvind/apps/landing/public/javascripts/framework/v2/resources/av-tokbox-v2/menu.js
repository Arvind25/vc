define(function (require) {
	var $            = require('jquery');
	var log          = require('log')('av-menu', 'info');

	var menu = {};
	var f_handle_cached;
	var custom_config_cached;

	menu.init = function (f_handle, custom) {
		f_handle_cached = f_handle;
		custom_config_cached = custom;

		$('.av-menu-item').on('click', menu.av_controls.fire);

		return null;
	};

	var screenshare_handler = null;
	var screenshare_enabled = false;

	menu.screenshare = {
		set_handler : function (handler) {
				screenshare_handler = handler;
				screenshare_enabled = true;
				$('#widget-nav li#nav-screenshare a').on('click', handler);
				$('#widget-nav li#nav-screenshare').removeClass('disabled');
			},

		enable : function () {
				if (screenshare_handler) {
					if (screenshare_enabled)
						return;

					$('#widget-nav li#nav-screenshare a').on('click', screenshare_handler);
					$('#widget-nav li#nav-screenshare').removeClass('disabled');
				}
			},

		disable : function () {
				screenshare_enabled = false;
				$('#widget-nav li#nav-screenshare a').off('click');
				$('#widget-nav li#nav-screenshare').addClass('disabled');
			},
	};

	var av_controls_handler = null;
	var cam_state = 'unmute';

	menu.av_controls = {
		set_handler : function (handler) {

			if (av_controls_handler)
				throw 'menu.av_controls : duplicate handler registered';

			av_controls_handler = handler;
			$('.av-menu-item').removeClass('disabled');
		},

		fire : function (ev) {
			curr_target = $(ev.currentTarget).attr('id');

			if (!av_controls_handler)
				return;

			/*
			 * The ids of the menu items are of the following syntax:
			 *     #av-menu-(audio|video)-(mute|unmute) */
			var target = curr_target.replace(/^av-menu-([^-]+)-.*$/g, "$1");
			var action = curr_target.replace(/^.*-([^-]*mute)$/g, "$1");
			var inverse_action = (action === 'mute' ? 'unmute' : 'mute');

			log.info ('target = ' + target + ' action = ' + action);
			av_controls_handler (target, action);
			$('#av-menu-' + target + '-' + action).css('display', 'none');
			$('#av-menu-' + target + '-' + inverse_action).css('display', 'inline-block');

			return;
		},
	};

	return menu;

});
