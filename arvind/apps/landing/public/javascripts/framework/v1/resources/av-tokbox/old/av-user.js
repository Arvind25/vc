requirejs.config({
  baseUrl: '/javascripts/generic/framework/resource/av',

paths: {
  /* the left side is the module ID,
   * the right side is the path to
   * the jQuery file, relative to baseUrl.
   * Also, the path should NOT include
   * the '.js' file extension.
   * */
  jquery : '/javascripts/ext/jquery-1.11.3.min'
}
});


define(function(require) {
  var $ = require('jquery');
  var av = require('av');
  var log = require('../../log')('av-user', 'info');

  av.init()
  .then (success, fail);

function success () {
  log.info('av.init success :)');
  $('#joinClass').show();
}

function fail(err) {
  log.error('av-user av.init failed with err : ' + err);
}


$( '#joinClass' ).click(function() {
  av.start()
  .then ( _s, _f );

function _s () {
  $('#joinClass').hide();
  $('#endClass').show();
  $('#resizeVideo').show();
}

function _f (e) {
  log.info('join class failed with: ' + e);
}
});

$( '#endClass' ).click(function() {
  av.stop()
  .then ( s, f );

function s () {
  $('#joinClass').show();
  $('#endClass').hide();
  $('#resizeVideo').hide();
}

function f (e) {
  log.info('stop class failed with: ' + e);
}

});


$( '#resizeVideo' ).click(function() {
  log.info('resize video click');
  var publisherContainer = document.getElementById('publisherContainer');
  publisherContainer.style.width = '1000px';
  publisherContainer.style.height = '750px';
});

});

$(document).ready(function () {
  $('#joinClass').hide();
  $('#endClass').hide();
  $('#resizeVideo').hide();

});

$(window).bind('beforeunload', function () {
  /*
   * av.stop();
   */
});

