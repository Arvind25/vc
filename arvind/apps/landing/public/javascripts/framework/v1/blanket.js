define(function(require) {
	var $      = require('jquery');
	var events = require('events');

	var blanket = {};

	blanket.show_progress = function (ev, data) {

		if (ev == 'STAGE IV complete') {
			$('#blanket').css('display', 'none');
		}
		else {
			$('#blanket p#progress').append('<br><span><i>stage : ' + ev + '</i></span>');
		}
	};

	blanket.show_error = function (err) {

		$('#blanket p#progress').append('<br><span style="color:#f20">' + err + '</span>');
	};

	events.bind ('core', blanket.show_progress, 'core');
	events.bind ('framework-progress', blanket.show_progress, 'core');


	return blanket;
});

