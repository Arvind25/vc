define(function(require){
	var $ 	= require('jquery');
	var log = require('log')('widget-attendees', 'info');

	var atl = {};

	var attached = null;

	atl.attach = function( anchor, _module){
		if( attached){
			log.error('Can\'t attach _module: ', _module.name, ': ', attached.name, ' already exists');
		}

		attached = _module;
		_module.resource.display_spec.anchor = $(anchor).find('.main-inner')[0];

		/* 
		 * I think we can attach the base template here
		 */

		log.info('atl.attach ok for ' + _module.name);
		return null;
	};
	return atl;
});
