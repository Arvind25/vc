define(function(require) {
	var $ = require('jquery');
	var log = require('log')('av-test', 'info');
	var framework = require('framework');

	var test = {};
	var f_handle = framework.handle ('av-test');

	test.init = function (display_spec, custom, perms) {
			var _d = $.Deferred();

			log.info ('av-test init called');

			var anchor = display_spec.anchor;
			$(anchor).append(
				'<div>' +
					'<h1> AV TEST </h1>' +
					'<p id="audio"> initial </p>' +
					'<input type="button" id="baudio"> send audio cmd </p>' +
				'</div>'
			);

			_d.resolve();

			return _d.promise();
	};

	test.start = function (sess_info) {
		log.info ('My Stuff = ', session_info);
	};

	function send_audio_mute () {
		f_handle.send_command ('*', 'audio.mute', 'on')
			.then (
				function (data) {
					log.info ('send_audio_must: on: ok', data);
				},
				function (err) {
					log.error ('send_audio_must: on: err: ' + err);
				}
			);
	}
	
	log.info ('av-test loaded');
	return test;
});
