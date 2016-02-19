var express   = require('express');
var path      = require('path');
var log       = require('landing/common/log');
var browser   = require('landing/lib/browser');
var router    = express.Router();

router.get ('/post-auth', function (req, res, next) {
	res.render('../views/test/post-auth');
});

module.exports = router;

