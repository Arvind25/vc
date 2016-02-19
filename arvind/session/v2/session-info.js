var fs = require('fs');
var log = require("./common/log");

var sess = {};

sess.load = function (file, callback) {
	fs.readFile (file, function (err, data) {
		if (err)
			return callback (err, null);

		try { sess.config = JSON.parse (data); }
		catch(e) {
			return callback (e, null);
		}

		return callback (null, sess.config);
	});
};

sess.config = {};

module.exports = sess;
