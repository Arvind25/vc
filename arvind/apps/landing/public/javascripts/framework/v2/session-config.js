define(function(require) {
	var $    = require('jquery');
	var xhr  = require('xhr');
	var urls = require('urls');

	var url = urls.session.load;
	var _s = {};

	_s.get = function () {
		var _d = $.Deferred();

		xhr.get(url).then(
					function (cb_data) {
						_d.resolve(cb_data.response_data);
					},
					function (cb_data) {
						_d.reject(cb_data.xhr.responseText);
					}
		);

		return _d.promise();
	};

	return _s;
});
