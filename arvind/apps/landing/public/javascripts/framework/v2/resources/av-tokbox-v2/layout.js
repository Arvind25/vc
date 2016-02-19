define(function(require) {
	var $            = require('jquery');
	var events       = require('events');
	var log          = require('log')('av-layout', 'info');
	var av_container = require('./container');
	var cpool        = require('./container-pool');
	var menu         = require('./menu');

	var layout = {};
	var sess_info_cached;
	var anchor;
	var pool_free = {}, pool_used = {};
	var current_layout = 'av-default';

	layout.init = function (f_handle, display_spec, custom, perms) {

		var templ_name = 'av-tokbox';
		var template = f_handle.template(templ_name);

		anchor = display_spec.anchor;

		if (!template)
			return 'av-layout: template "' + templ_name + '" not found';

		$(anchor).append( template() );
		set_handlers ();

		return null;
	};

	layout.get_container = function (type, meta_info) {
		/*
		 * Type should be : 'video-primary', 'video-secondary', 'screenshare-local', 'screenshare-remote */
		var mode = display_mode (current_layout, type);
		var cont =  cpool.alloc_container (type, mode, meta_info);

		/* We know that the # of containers for screenshare are limited. So if we just
		 * allocated one for screenshare then see if we've already exhausted all containers
		 * reserved for screenshare. If yes, disable the menu-item for screenshare */

		if (type === 'screenshare-local' || type === 'screenshare-remote')
			if (!cpool.free_count('screenshare'))
				menu.screenshare.disable();

		return cont;
	};

	layout.giveup_container = function (container, reason) {
		var type = container.get_type();

		layout_set_to_default(current_layout, null);
		cpool.giveup_container (container);

		/* See comment in 'get_container' above */
		if (type === 'screenshare-remote' || type === 'screenshare-local')
			menu.screenshare.enable();

		return;
	};

	layout.show_error = function (container, error) {
		return container.show_error (error);
	};

	layout.stream_destroyed = function (container, reason) {
		container.stream_destroyed (reason);
	};

	layout.reveal_video = function (container) {
		container.reveal_video ();
	};

	/*
	 * _______Container Pool Management___________
	 *
	 */
	function probe_layout (anchor, pool) {

		$.each( $('#av-containers .av-container'), function (index, div) {
			var id = $(div).attr('id');
			pool[id] = new av_container(div);
			log.info ('probe_layout: adding container "#' + id + '" to av pool');
		});
	}

	function set_handlers () {

		events.bind('framework:layout', layout_set_to_default, 'av-layout');
		events.bind('av:connection', flasher, 'av-layout');

		$('.av-container').on('click', function (ev) {
			var clicked_div = ev.currentTarget;

			var div_id = $(clicked_div).attr('id');
			var clicked_container = cpool.get_container_by_id ('used', div_id);

			if (!clicked_container) {
				log.error ('clicked_container is null. Ignoring click.');
				return;
			}

			switch (current_layout) {

				case 'av-default':
					handle_click_default (clicked_container);
					break;

				case 'av-fullscreen':
					handle_click_fullscreen (clicked_container);
					break;

				case 'av-tiled':
					/* Do nothing for now */
					break;

				default:
					/* Should not come here */
					log.error ('unknown layout "' + current_layout + '". Handling as default.');
					handle_click_default (clicked_container);
					break;

			}
		});
	}

	function handle_click_default (clicked) {
		var primary, pip;

		/* 
		 * If screnshare is cliked then make it fullscreen, and 
		 * make the primary pip. Lose all the secondaries.
		 */
		if (clicked.in_mode('screenshare')) {
			primary = cpool.get_containers_by_mode ('primary')[0];
			clicked.set_mode ('full');
			primary.set_mode ('pip');
			return;
		}

		/* 
		 * If the clicked video is secondary, then exchange with primary
		 */
		if (clicked.in_mode('secondary')) {
			primary = cpool.get_containers_by_mode ('primary')[0];
			primary.set_mode('secondary');
			clicked.set_mode('primary');
			return;
		}

		/* 
		 * If the clicked video is full, then this happened due to an earlier
		 * click on the screenshare. Restore the original layout.
		 */
		if (clicked.in_mode('full')) {
			pip = cpool.get_containers_by_mode ('pip')[0];
			pip.set_mode('primary');
			clicked.set_mode('screenshare');
			return;
		}
	}

	function handle_click_fullscreen (clicked) {
		var primary, pip;

		/* 
		 * In fullscreen layout, we only respond to the clicks
		 * on a secondary by swapping the primary with it.
		 */
		if (clicked.in_mode('secondary')) {
			primary = cpool.get_containers_by_mode ('primary')[0];
			clicked.set_mode ('primary');
			primary.set_mode ('secondary');
			return;
		}

	}

	function display_mode (_layout, type) {
		var mode;

		/* 
		 * Return the display mode depending upon the layout
		 */

		switch (_layout) {
			case 'av-fullscreen':
				mode = {
					'video-primary'      : 'primary',
					'video-secondary'    : 'secondary',
					'screenshare-local'  : 'secondary',
					'screenshare-remote' : 'secondary',
				};
				break;

			case 'av-tiled':
				mode = {
					'video-primary'      : 'secondary',
					'video-secondary'    : 'secondary',
					'screenshare-local'  : 'secondary',
					'screenshare-remote' : 'secondary',
				};
				break;

			case 'av-default':
				mode = {
					'video-primary'      : 'primary',
					'video-secondary'    : 'secondary',
					'screenshare-local'  : 'secondary',
					'screenshare-remote' : 'screenshare',
				};
				break;

			default:
				mode = {
					'video-primary'      : 'primary',
					'video-secondary'    : 'secondary',
					'screenshare-local'  : 'secondary',
					'screenshare-remote' : 'screenshare',
				};
				break;
		}

		return mode[type];
	}

	var incomning_count = 0;
	function flasher (ev, data) {

		var flasher_el = $('#av-indicator');

		if (ev === 'incoming-connection')
			incomning_count++;
		if (ev === 'incoming-media')
			incomning_count--;

		if (incomning_count < 0)
			incomning_count = 0;

		if (incomning_count) {
			$(flasher_el).css('display', 'block');
		}
		else {
			$(flasher_el).css('display', 'none');
		}
	}

	function layout_set_to_default (ev, data) {
		var new_layout = ev;

		cpool.get_used_list ().forEach(function (container, index, arr) {
			var curr_mode = container.get_mode();
			var type      = container.get_type();
			var new_mode  = display_mode (new_layout, type);

			if (new_mode != curr_mode)
				container.set_mode (new_mode);
		});

		current_layout = new_layout;
		return;
	}

	return layout;

});
