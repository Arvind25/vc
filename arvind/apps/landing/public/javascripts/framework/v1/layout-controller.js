define(function(require) {
	var $         = require('jquery');
	var av        = require('widget-av');
	var nav       = require('widget-nav');
	var chat	  = require('widget-chat');
	var attendees = require('widget-attendees');
	var notify    = require('widget-notify');
	var tabs      = require('widget-tabs');
	var events    = require('events');
	var log       = require('log')('layout-ctrl', 'info');

	var lc            = {};
	var layout        = {};
	var _framework;
	var emitter;

	lc.init = function (sess_config, f_handle) {
		_framework = f_handle.handle('layout-ctrl');
		emitter = events.emitter('framework:layout', 'layout-controller');
	};

	lc.probe_layout = function () {

		if ($('#widget-nav').length !== 0)
			layout.nav = $('#widget-nav')[0];

		if ($('#widget-notify').length !== 0)
			layout.notify = $('#widget-notify')[0];

		if ($('#widget-av').length !== 0)
			layout.av = $('#widget-av')[0];

		if ($('#widget-chat').length !== 0)
			layout.chat = $('#widget-chat')[0];

		if ($('#widget-attendees').length !== 0)
			layout.attendees = $('#widget-attendees')[0];

		if ($('#widget-tabs').length !== 0)
			layout.tabs = $('#widget-tabs')[0];

		if ($('#widget-side-left').length !== 0)
			layout.side_left = $('#widget-side-left')[0];

		if ($('#widget-side-right').length !== 0)
			layout.side_right = $('#widget-side-right')[0];

		/*
		 * If there is a native menu available then attach a layout-switch handler to 
		 * it. */
		if ($('#widget-nav ul.nav li#layout').length)
			$('#widget-nav ul.nav li#layout').on('click', switch_layout);
	};

	lc.attach_module = function (_module) {
		var widget = _module.resource.display_spec.widget;
		var inner;

		switch (widget) {

			case 'none'   		: return null;
			case 'av'     		: return av.attach (layout.av, _module);
			case 'notify' 		: return notify.attach (layout.notify, _module);
			case 'tabs' 		: return tabs.attach (layout.notify, _module);
			case 'nav'    		: return nav.attach (layout.nav, _module);
			case 'chat'		  	: return chat.attach (layout.chat, _module);
			case 'attendees'	: return attendees.attach (layout.attendees, _module);

			default : 
				log.error ('_module ' + _module.name + ' requesting non-existent widget ' + widget);
				return '_module ' + _module.name + ' requesting non-existent widget ' + widget;
		}

		return null;
	};

	lc.post_init = function () {

		/* Create menu for layout changes */
		var _m = _framework.menu;

		_m.add ('Layout', 'layout');
		_m.add ('Full Video', 'layout.av_full');
		_m.add ('Tiled Video(s)', 'layout.av_tiled');
		_m.add ('Default', 'layout.av_default');
		_m.handler (menu_handler);
	};

	var curr_layout = 'av_default';
	var list = [
		{ layout : 'av_default', event : 'av-default',    body_class : ''},
		{ layout : 'av_full',    event : 'av-fullscreen', body_class : 'av-fullscreen' },
		{ layout : 'av_tiled',   event : 'av-tiled',      body_class : 'av-tiled' },
	];

	function menu_handler (menu_uid) {

		switch (menu_uid) {
			case 'layout.av_full':
				$('body').addClass('av-fullscreen');
				emitter.emit ('av-fullscreen', 'hold on boys ! Video coming up fullscreen !');
				curr_layout = 'av_full';
				break;

			case 'layout.av_tiled':
				$('body').removeClass('av-tiled');
				emitter.emit ('av-tiled', '... and now ... tilded video');
				curr_layout = 'av_tiled';
				break;

			case 'layout.av_default':
				$('body').removeClass('av-tiled');
				$('body').removeClass('av-fullscreen');
				emitter.emit ('default', 'and back to default');
				curr_layout = 'av_default';
				break;
		}
	}

	function switch_layout () {
		var list_len = list.length;

		for (var i = 0; i < list_len; i++) {

			if (list[i].layout == curr_layout) {

				var next = list[ (i + 1) % list_len];
				emitter.emit (next.event, 'switching layouts ...');

				$('body').removeClass(list[i].body_class);
				if (next.body_class && next.body_class.length)
					$('body').addClass(next.body_class);

				curr_layout = next.layout;
				break;
			}
		}
	}

	return lc;
});
