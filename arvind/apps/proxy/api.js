var express     = require('express');
var router      = express.Router();
var proxy_api   = require('./proxy-api');

router.post ('/route/add', proxy_api.register);
router.post ('/route/remove', proxy_api.unregister);
router.get  ('/route', proxy_api.list);

module.exports = router;
