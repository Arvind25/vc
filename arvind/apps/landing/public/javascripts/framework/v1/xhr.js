define(function(require) {
	var $   = require('jquery');
	var log = require('log')('xhr', 'info');

	var xhr_timeout = 20000;

	var xhr = {};

	xhr.get = function (url, context) {
		var callback_data = {};
		var _d = $.Deferred();

		callback_data.context   = context;

		$.ajax ({
			async: true,
			cache: false,
			type: 'GET',
			contentType: 'application/json',
			url: url,
			success: function (_data, textStatus, xhr) {

					log.info (' get ' + url + ' ok');
					callback_data.response_data = _data;
					_d.resolve(callback_data);
				},

			error: function (xhr, textStatus, error) {

					log.error (' get ' + url + ' : error = ' + error);
					callback_data.error = error;
					callback_data.textStatus = textStatus;
					callback_data.xhr = xhr;
					_d.reject(callback_data);
				},

			timeout: xhr_timeout
		});

		return _d.promise();
	};

	return xhr;
});
