var $ = require('jquery-deferred');
var w = {};

var log;
var coms;

w.init = function (myinfo, common, handles) {
	var _d = $.Deferred ();

	log = handles.log;
	coms = handles.coms;

	log.info ('white-board basic : init :', myinfo);

	_d.resolve ();
	return _d.promise ();
};

w.init_user = function (user) {
	var _d = $.Deferred ();

	_d.resolve ({
		background : 'white'
	});

	return _d.promise ();
};

w.info = function (from, id, info) {
	coms.broadcast_info (id, info, from);
};

module.exports = w;
