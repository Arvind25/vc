define(function(require) {
	var $ = require('jquery');
	var log = require('log')('widget-notify', 'info');

	var notify = {};
	var attached = {};

	notify.attach = function (anchor, _module) {
		var name = _module.name;

		if (attached[name]) {
			log.error ('Can\'t attach _module:', _module.name, ': module with the same name already attached');
			return 'duplicate module name';
		}

		attached[name] = _module;

		/*
		 * Make a .box div in the .inner container
		 * 	- also give it an id
		 */

		var inner = $(anchor).find('.main-inner')[0];
		var id = 'notify-' + _module.name;
		$(inner).append('<div id="' + id + '" class="box"></div>');

		_module.resource.display_spec.anchor = $('#' + id);

		/*
		 * TODO:
		 * 	If the _module has a template, then attach it under the anchor
		 */

		log.info('attach ok for ' + _module.name);
		return null;
	};

	return notify;
});

