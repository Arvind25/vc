define(function(require) {
  var $    = require('jquery');
  var xhr  = require('../../xhr');
  var log  = require('../../log')('getconfig', 'info');

  var _s = {};
  /* config info */
  var _c = {};
  var av_sig_port = null;

  _s.get = function ( classid ) {
    var _d = $.Deferred();

    var port = '2178';
    var pathname = '/session/v1/' + classid;

    var url = 'http://' + window.location.hostname + ':' + port + pathname;

    xhr.get(url).then(
      function (cb_data) {
        _d.resolve(cb_data.response_data);
      },
      function (cb_data) {
        log.info('failed with: ' + cb_data.xhr.responseText);
        _d.reject(cb_data.xhr.responseText);
      }
      );

    return _d.promise();
  };

  /*
   * get media session or room id from app server
   */
  _s.getsessionid = function ( config ) {
    var _d = $.Deferred();
    log.info('getsessionid: ');
    var port;
    if ( config ) {
      _c = config;
      port = config.custom.server.port || 8080;
    } else {
      port = 8080;
    }
    av_sig_port = port;

    var pathname = '/rooms/';

    var url = pathname;

    var data = {
      userRole : 'moderator'
    };

    xhr.post(url, null, data).then(
      function (cb_data) {
        log.info('getsessionid success: ');
        _d.resolve(cb_data.response_data);
      },
      function (cb_data) {
        log.info('getsession failed with: ' + cb_data.xhr.responseText);
        _d.reject(cb_data.xhr.responseText);
      }
      );

    return _d.promise();
  };

  /*
   * get token from av app server
   */
  _s.gettoken = function ( req ) {
    var _d = $.Deferred();
    log.info('gettoken: ');

    var port = av_sig_port;

    var pathname = '/rooms/token';

    var url = 'http://' + window.location.hostname + ':' + port + pathname;

    var data = {
      classId : req.classId,
      mediaRoomId : req.mediaRoomId,
      userRole : _c.custom.user.role,
      userName : _c.custom.user.name
    };

    /* url, context, data */
    xhr.post(url, null, data).then(
      function (cb_data) {
        log.info('gettoken success: ');
        _d.resolve(cb_data.response_data);
      },
      function (cb_data) {
        log.info('gettoken failed with: ' + cb_data.xhr.responseText);
        _d.reject(cb_data.xhr.responseText);
      }
      );

    return _d.promise();
  };

  return _s;
});
