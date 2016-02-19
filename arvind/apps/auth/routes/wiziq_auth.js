var express      = require('express');
var path         = require('path');
var log          = require('auth/common/log');
var wiziq_auth   = require('auth/controllers/wiziq_auth');
var router       = express.Router();

router.get( '/', wiziq_auth.show );

/*router.post('/', function(req, res) {
  console.log(req.body.hostName);
  console.log(req.body.authType);
  db.fetch_data_from_db(req.body)
  .then( function done(){
  res.contentType('json');
  res.send({ some: JSON.stringify({response:'json'}) });
  },
  function fail(err)
  {
  console.log("error in deleting values to db "+err);
  }
  );

  });*/

module.exports = router;

