var express          = require( 'express' );
var router           = express.Router();
var controller       = require('auth/controllers/config');

/*
 * Actual RESTful calls for configuration */

router.get ( '/', controller.get_all );
router.post ( '/add', controller.add );
router.post ( '/remove',controller.remove );

module.exports = router;





