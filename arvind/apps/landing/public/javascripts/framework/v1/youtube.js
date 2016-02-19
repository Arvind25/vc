define(function(require) {
	var $ = require('jquery');
	var log = require('log')('youtube', 'info');
	var framework = require('framework');

	var youtube = {};

	youtube.init = function (_framework, custom, perms) {
			var _d = $.Deferred();

			log.info ('youtube init called');

			var anchor = _framework.anchor;
			$(anchor).html('<iframe width="420" height="315" src="https://www.youtube.com/embed/4hHhBJgsPZw?autoplay=1&modestbranding=1&controls=0" frameborder="0" allowfullscreen></iframe>');
			_d.resolve();

			return _d.promise();
	};
	
	log.info ('youtube loaded');
	return youtube;
});
