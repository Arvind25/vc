require.config({
  baseUrl: '/javascripts/generic/framework/resource/av',
  paths: {
  },
});

define(function(require) {
  var $ = require('jquery');
  var log = require('../../log')('av', 'info');
  var framework = require('../../framework');
  var _c = require('av-conf');
  var avcontainer = require('avcont');

  $.whenall = function(arr) { return $.when.apply($, arr); };

  var c = {};
  var av = {};
  var av_modules = [];

  av.init = function (display_spec, custom, perms) {
    log.info ('ss av.init called');

    var _d = $.Deferred();
    var anchor = display_spec.anchor;
    /* FIXME */
    $(anchor).html(avcontainer.get());

    c = {
      display_spec  : display_spec,
      custom        : custom,
      perms         : perms
    };

    __load(c)
      .then ( __init, fail )
      .then ( s , fail)
      ;

    function s () {
      log.info('__init success');
      return _d.resolve();
    }

    function fail (err) {
      log.error ('fatal : ' + err);
      _d.reject(err);
    }

    return _d.promise();
  };

  av.start = function (ses_info) {
    var _d = $.Deferred();
    log.info('av.start called. My Stuff = ', ses_info);
    av_modules[0].handle.start(ses_info)
      .then ( _d.resolve, _d.reject )
      ;
    return _d.promise();
  };

  av.stop = function (module) {
    var _d = $.Deferred();
    log.info('av.stop called');
    av_modules[0].handle.stop()
      .then ( _d.resolve, _d.reject )
      ;
    return _d.promise();
  };

  /*
   * ----------- private functions ------------
   */

  __load = function ( config ) {
    log.info('inside av.__load', config);

    var _d = $.Deferred();
    var _d_arr = [];

    __loadfile(config)
      .then ( _d.resolve.bind(null, config), _d.reject)
      ;

    return _d.promise();
  };


  function __loadfile ( config ) {
    var _d = $.Deferred();
    var file = config.custom.server.name;
    require([ file ],
        function (arg) {
          var av_module = {
            name : file,
            handle : arg
          };

          av_modules.push(av_module);

          /*
           * Save av resource config
           */
          __saveavconfig(config);

          log.info ('loaded module: ' + file +  ' calling resolve with arg: ' + JSON.stringify(config));

          _d.resolve(config);
        },
        function (err) {
          var error = 'could not load module ' + file + ' reason: ' + err;
          log.error (error);
          _d.reject(error);
        }
        );

    return _d.promise();
  }

  __saveavconfig = function ( avconfig ) {
    _c.setav (avconfig);
  };

  __init = function ( config ) {

    var _d = $.Deferred();

    var _d_arr = [];

    var p = __initmodule(av_modules[0], config);

    p.then(
        function () {
          log.info ('init_av_modules finished');
          _d.resolve();
        },
        function () {
          var e = 'init_av_modules - some modules failed to initialize';
          log.error (e);
          _d.reject(e);
        }
        );

    return _d.promise();
  };

  function __initmodule ( module ) {
    return module.handle.init(c);
  }

  return av;
});

