var express          = require( 'express' );
var router           = express.Router();
var fb_auth          = require( 'auth/social_auth/fb' );
var google_auth      = require( 'auth/social_auth/google' );
var wiziq_auth       = require( 'auth/routes/wiziq_auth' );

/* different routes for authentication */
router.use ( '/google', google_auth );
router.use ( '/fb', fb_auth );
router.use ( '/wiziq', wiziq_auth );

module.exports = router;





