var express          = require( 'express' );
var router           = express.Router();
var controller       = require('auth/controllers/config_views');
/*
 * Get requests to load pages
 */
router.get ( '/add', controller.add );
router.get ( '/remove',controller.remove );

module.exports = router;

