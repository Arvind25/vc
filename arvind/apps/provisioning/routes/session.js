var express         = require('express');
var path            = require('path');
var sess            = require('provisioning/controllers/session');
var log             = require('provisioning/common/log');
var router          = express.Router();

router.use (function (req, res, next) {
	var child_logger = log.child ({ req_id : req.req_id });
	req.log = child_logger;
	next ();
});

router.post ('/start', function(req, res, next) {
	return sess.start (req, res, next);
});

module.exports = router;

