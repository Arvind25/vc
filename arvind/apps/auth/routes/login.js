var express   = require('express');
var path      = require('path');
var log       = require('auth/common/log');
var login     = require('auth/controllers/login');
var router    = express.Router();

router.get ( '/', login.show );

module.exports = router;

