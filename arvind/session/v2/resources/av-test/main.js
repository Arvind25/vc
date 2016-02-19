var $               = require("jquery-deferred");

var av_test = {};
var log;

av_test.init = function (myinfo, common, handles) {
	log = handles.log;

	log.info ('av-test: init ok');
};

av_test.init_user = function (user) {
	var _d = $.Deferred ();

	_d.reject ({
		u : user,
		comment : 'this is a test string from the av-test module'
	});

	return _d.promise ();
};

av_test.session_info = function () {
	return 'hello';
};

module.exports = av_test;
