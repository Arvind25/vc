var express         = require('express');
var path            = require('path');
var _class          = require('api-backend/controllers/class');
var log             = require('api-backend/common/log');
var router          = express.Router();

router.use (function (req, res, next) {
	var child_logger = log.child ({ req_id : req.req_id });
	req.log = child_logger;
	next ();
});

router.post ('/create', _class.create);
router.post ('/update/:class_id', _class.update);
router.post ('/remove/:class_id', _class.remove);

module.exports = router;

