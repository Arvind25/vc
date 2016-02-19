define(function(require) {
	var $ = require('jquery');
	var log = require('log')('widget-av', 'info');

	var av = {};
	var attached = null;

	av.attach = function (anchor, _module) {
		if (attached) {
			log.error ('Can\'t attach _module:', _module.name, ':', attached.name, 'already attached');
			return 'already attached';
		}

		attached = _module;
		_module.resource.display_spec.anchor = $(anchor).find('.main-inner')[0];

		/*
		 * TODO:
		 * 	If the _module has a template, then attach it under the anchor
		 */

		log.info('av.attach ok for ' + _module.name);
		return null;
	};

	return av;
});

