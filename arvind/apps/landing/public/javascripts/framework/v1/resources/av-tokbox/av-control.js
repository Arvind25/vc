/*
 * AV resource control. UI part
 */
define(function(require) {
    var $ = require('jquery');
    var remodal = require('remodal');
    var log = require('log')('av-control', 'info');
    var otd = require('./ot-layout');
    var ssui = require('./screenshare/ssui');
    window.jade = require('jade');

    var avc = {};
    var layout = false;
    var display_spec = {};
    var handle = {};

    var avcontainer;
    var pubsc;
    var subsc;
    var _l = {};
    var cbs = {};
    var lvmute = false;
    var config;


    window.onresize = __resize;


    function __resize() {
        if ( layout ) {
            avc.layout();
        }
    }


    avc.init = function (_display_spec, _handle, _config, _cbs) {
        var _d = $.Deferred();

        display_spec = _display_spec;
        handle = _handle;
        cbs = _cbs;
        config = _config;

        var anchor = display_spec.anchor;
        var template = handle.template('av-tokbox');

        if ( !template ) {
            _d.reject ('avc.init: template not found');
            return _d.promise();
        }

        $(anchor).append(template());
        pubsc = $(anchor).find('#av-primary-cont')[0];
        subsc = $(anchor).find('#av-secondary-outer')[0];

        registerHandlers();
        def_pri_vid_ctrl();
        initlayout(subsc);

        _d.resolve();

        return _d.promise();
    };


    avc.showMessage = function ( m ) {
    };


    avc.pubc = function () {
        return pubsc;
    };


    avc.subc = function () {
        return subsc;
    };


    avc.layout = function () {
        _l.layout_p();
        _l.layout_s();
    };


    avc.usermediasuccess = function (type) {
        showMicMute();
        hideStart();
        showDisconnect();
        if ( config.screenshare ) {
            ssui.showss();
        }
        if ( type === 'audiovideo' ) {
            $('#avcamstop').show();
        }
    };


    avc.usermediafail = function (type) {

    };


    avc.usermediapublished = function() {

    };


    avc.usermediaunpublished = function() {

    };


    avc.disconnected = function() {
        def_pri_vid_ctrl();
        showStart();
    };


    function showMicMute () {
        if ( $('#avmic-unmute').is(':hidden') ) {
            $('#avmic-mute').show();
        }
    }


    function hideMicMute () {
        $('#avmic-mute').hide();
    }


    function showMicUnmute () {
        $('#avmic-unmute').show();
    }


    function hideMicUnmute () {
        $('#avmic-unmute').hide();
    }


    function showStart () {
        if ( config.debug_controls ) {
            $('#avstart').show();
        }
    }


    function hideStart () {
        if ( config.debug_controls ) {
            $('#avstart').hide();
        }
    }


    function showDisconnect () {
        if ( config.debug_controls ) {
            $('#avdisconnect').show();
        }
    }


    function hideDisconnect () {
        if ( config.debug_controls ) {
            $('#avdisconnect').hide();
        }
    }


    avc.svcstyle = function (sub) {
        var body = '<div id=' + '"' + 'secvidmenu_' + sub.element.id + '"' + ' class="avsmenu"' + ' </div>';
        $('#' + sub.element.id).append(body);
    };


    function initlayout (cont) {
        var opt = {
            bigFirst    : false,
            fixedRatio  : true,
            animate     : true,
            easing      : 'swing'
        };

        _l = otd.initLayoutContainer(pubsc, subsc, opt);
        layout = true;
    }


    function createD(id) {
        var subscriberDiv = document.createElement('div');
        subscriberDiv.setAttribute('id', 'stream' + id);
        subscriberDiv.setAttribute('style','display:inline-block;');
        subsc.appendChild(subscriberDiv);
        log.info('appended subscriber div to container');
        return subscriberDiv;
    }


    function maximize() {
        log.info('av maximise button click');
    }


    function micmute() {
        log.info('micmute button click');
        cbs.mutela();
        hideMicMute();
        showMicUnmute();
    }


    function micunmute() {
        log.info('micunmute button click');
        cbs.unmutela();
        hideMicUnmute();
        showMicMute();
    }


    function toggleVideo() {
        log.info('toggleVideo button click');
        if ( !lvmute ) {
            muteLVideo();
        } else {
            unmuteLVideo();
        }
        lvmute = !lvmute;
    }


    function muteLVideo() {
        cbs.mutelv();
        $('#av-menu-outer .btn span.fa-video-camera').css('color', 'red');
    }


    function unmuteLVideo() {
        cbs.unmutelv();
        $('#av-menu-outer .btn span.fa-video-camera').css('color', 'white');
    }


    function resetLVideo() {
        lvmute = false;
        $('#av-menu-outer .btn span.fa-video-camera').css('color', 'white');
    }


    function toggleSubVideo (id) {
        log.info('toggleSubVideo button click');
        if ( cbs ) {
            cbs.muterv(id);
        }
    }


    function start() {
        log.info('start button click');
        if ( cbs ) {
            cbs.start();
        }
    }


    function disconnect() {
        log.info('disconnect called.');
        if ( cbs ) {
            cbs.stop();
            def_pri_vid_ctrl();
            showStart();
        }
        resetLVideo();
    }


    function screenShare() {
        log.info('screenShare click.');
        if ( cbs ) {
            cbs.screenShare();
        }
    }


    function def_pri_vid_ctrl() {
        $('#avmax').hide();
        hideMicMute();
        hideMicUnmute();
        $('#avcamstop').hide();
        $('#avstart').hide();
        $('#avdisconnect').hide();
        ssui.hidess();
    }


    function secvidclick() {
        log.info('secvidclick');
        var uid, ident;
        var id = $(this).attr('id');
        if ( id ) {
            ident = id.split('_')[1];
            uid = id.split('_')[2];
        }
        if ( ident && uid ) {
            if ( ident === 'RS' ) {
                toggleSubVideo('RS_' + uid);
            } else if ( ident === 'LS' ) {
                toggleVideo();
            }
        }
    }


    function registerHandlers() {
        $('#avmax').click(maximize);
        $('#avmic-mute').click(micmute);
        $('#avmic-unmute').click(micunmute);
        $('#avcamstop').click(toggleVideo);
        if ( config.debug_controls ) {
            $('#avstart').click(start);
            $('#avdisconnect').click(disconnect);
        }
    }


    return avc;
});
