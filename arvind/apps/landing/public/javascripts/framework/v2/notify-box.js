define(function(require) {
	var $ = require('jquery');
	var log = require('log')('notify-box', 'info');
	var framework = require('framework', 'info');

	var notify_box = {};

	notify_box.init = function (_framework, custom, perms) {
			var _d = $.Deferred();

			log.info ('notify_box init called');

			var anchor = _framework.anchor;
			$(anchor).append (
				'<span class="fa fa-info-circle"></span>'
			);

			_d.resolve();

			return _d.promise();
	};
	
	log.info ('notify_box loaded');

	return notify_box;
});
