define([
	'./ot-wrap',
	'jquery',
	'log',
	'framework',
	'./av-config',
	'./av-res',
	'./av-control',
	'./screenshare/ss',
	'./screenshare/ssui',
    'events'
], function(OT, $, __log, framework, config, videores, avc, screenshare, ssui, events) {


    var log = __log('av-tokbox', 'info');
    var f_handle = framework.handle ('av-tokbox');

    var ot = {};

    var _ses_info = {};
    var c = {};
    var _ses = {};
    var numusers = 0;
    var publisher;
    var _subs = [];
    var classid = null;
    var tk;
    var otc;
    var cbs = {};
    var sscbs = {};
    var res_cur;
    var res_new;
    var hasAudio = true;
    var hasVideo = true;


    ot.init = function (display_spec, custom, perms) {
        log.info ('av-ot init called');
        var _d = $.Deferred();
        c = {
            display_spec  : display_spec,
            custom        : custom,
            perms         : perms
        };

        config.setav(c);
        bind_ev();

        cbs = {
            'start' : ot.start,
            'stop' : ot.stop,
            'mutela' : muteLocalAudio,
            'unmutela' : unmuteLocalAudio,
            'mutelv' : muteLocalVideo,
            'unmutelv' : unmuteLocalVideo,
            'mutera' : muteRemoteAudio,
            'unmutera' : unmuteRemoteAudio,
            'muterv' : muteRemoteVideo,
            'unmuterv' : unmuteRemoteVideo,
        };

        sscbs = {
            'screenShare' : screenShareStart,
        };

        avc.init(display_spec, f_handle, c.custom, cbs)
            .then (ssui_init.bind(sscbs), _d.reject)
            .then (_d.resolve, _d.reject)
            ;

        return _d.promise();
    };


    ot.start = function ( ses_info ) {
        var _d = $.Deferred();
        log.info ('ot.start: ', ses_info);
        if ( $.isEmptyObject(_ses_info) ) {
            _ses_info = ses_info;
        }

        initialize (_ses_info)
            .then ( connect, _d.reject )
            .then ( start_publish, _d.reject )
            .then ( _d.resolve, _d.reject )
            ;
        return _d.promise();
    };


    ot.stop = function () {
        var _d = $.Deferred();
        log.info('ot.stop called');
        unpublish();
        unsubscribe();
        disconnect();
        _d.resolve();
        return _d.promise();
    };


    ot.deinit = function ( ) {
        var _d = $.Deferred();
        _d.resolve();
        return _d.promise();
    };


    function ssui_init () {
        var _d = $.Deferred();
        if ( c.custom.screenshare ) {
            ssui.init(c.display_spec, f_handle, sscbs)
                .then(_d.resolve, _d.reject);
        } else {
            _d.resolve();
        }
        return _d.promise();
    }


    function bind_ev () {
        if ( !events.bind('framework:layout', onEv, 'av-tokbox') ) {
            log.error('event bind failed.');
        } else {
            log.info('ev bind success');
        }
    }


    function onEv (ev, data) {
        log.info('onEv ev: ', ev);
        log.info('onEv data: ', data);
        /* these names must be unique and well defined in some file */
        if ( ev === 'av-fullscreen' ) {
            onFullScreenLayout();
        } else if ( ev === 'default' ) {
            onDefaultLayout();
        }
    }


    function onFullScreenLayout () {
        var res_fs = otres(config.getMaxVideoRes());
        if ( res_fs !== res_cur ) {
            log.info('republishing with higher resolution: ', res_fs);
            res_new = config.getMaxVideoRes();
            republish();
        }
    }


    function onDefaultLayout () {
        var res_def = otres(config.getVideoRes());
        if ( res_def !== res_cur ) {
            log.info('republishing with default resolution: ', res_def);
            res_new = config.getVideoRes();
            republish();
        }
    }


    function republish () {
        savePubStreamProp();
        unpublish();
        init_pub()
            .then ( start_publish, f )
            .then ( restorePubStreamProp, f )
            .then ( s, f )
            ;
        function s () {
            log.info('republish success');
            avc.layout(); // TODO
        }

        function f (error) {
            log.info('republish failed: ', error);
        }
    }


    function savePubStreamProp () {
        hasAudio = publisher.stream.hasAudio;
        hasVideo = publisher.stream.hasVideo;
    }


    function restorePubStreamProp () {
        if ( !hasAudio ) {
            publisher.publishAudio(false);
        }
        if ( !hasVideo ) {
            publisher.publishVideo(false);
        }
    }


    function disconnect () {
        _ses.disconnect();
    }


    function unpublish () {
        if ( _ses ) {
            if ( publisher ) {
                log.info('publisher unpub and destroy');
                _ses.unpublish(publisher);
                publisher.destroy();
                publisher.off();
                publisher = null;
            }
        }
    }


    function unsubscribe () {
        _subs.forEach(function (sub) {
            log.info('calling unsubscribe');
            _ses.unsubscribe(sub);
        });
        _subs = [];
        numusers = 0;
    }


    function initialize() {
        var _d = $.Deferred();
        initOT()
            .then ( s, fail );

        function s () {
            log.info('initOT success');
            _d.resolve();
        }

        function fail ( error ) {
            log.error('initOT failed with error: ' + error);
            _d.reject();
        }

        return _d.promise();
    }


    function initOT () {
        var _d = $.Deferred();

        var sessionid = _ses_info.sessionid;
        tk = _ses_info.token;
        var _k = _ses_info.key;
        var classid = _ses_info.classid;
        var username = _ses_info.username;
        var authid = _ses_info.authid;
        var session;

        if ( OT.checkSystemRequirements() === 1 ) {
            log.info('calling init session');
            session = OT.initSession(_k, sessionid);
            _ses = session;
            _ses.off();
            ses_handlers();
            if ( c.custom.screenshare ) {
                initss()
                    .then(_d.resolve, _d.reject);
            } else {
                _d.resolve();
            }
        } else {
            var err = 'WebRTC Audio Video not supported on this browser. Please use the latest Chrome, Firefox or Opera browser';
            showMessage(err);
            _d.reject(err);
            // TODO: remove
            alert(err);
        }

        return _d.promise();
    }


    function initss () {
        var _d = $.Deferred();
        var ssinfo = {};
        ssinfo.chromeScLocalExtId = _ses_info.chromelocalextensionid;
        ssinfo.chromeScExtId = _ses_info.chromeextensionid;
        ssinfo.inlinechromeextinstall = _ses_info.inlinechromeextinstall;
        screenshare.init(ssinfo)
            .then(_d.resolve, _d.reject);
        return _d.promise();
    }


    function connect (t) {
        log.info('connect called');
        var _d = $.Deferred();
        /* init pub and connect can be done in || */
        ses_connect (t || tk)
            .then ( init_pub, _d.reject )
            .then ( s , f )
            ;

        function s () {
            log.info('connect, init_pub success.');
            _d.resolve();
        }

        function f (e) {
            log.error('init_pub failed with:', e);
            _d.reject(e);
        }

        return _d.promise();
    }


    /*
     * publisher init code.
     * get device, set video opts and div etc.
     * stream is not started here
     */
    function init_pub () {
        log.info('av init_pub called');

        var _d = $.Deferred();

        if ( !ispublisher() || _ses.capabilities.publish !== 1 ) {
            log.info('configured to be a subscriber');
            log.info('Client not a publisher, else check device availability');
            _d.resolve();
            return _d.promise();
        }

        //get_device ()
        //.then( ot_initpub, fail )

        ot_initpub()
            .then ( lmediaok.bind(_d), lmediafail.bind(_d) )
            ;

        function fail() {
            log.error('get_device failed.');
            _d.reject();
        }

        return _d.promise();
    }


    function lmediaok (mediatype) {
        log.info('ot_initpub success ! return resolve');
        avc.usermediasuccess(mediatype);
        this.resolve();
    }


    function lmediafail (e) {
        log.info('init_pub failed with: ' + e);
        avc.usermediafail();
        this.reject(e);
    }


    function get_device () {
        log.info('get_device');
        var _d = $.Deferred();

        var d = {};

        OT.getDevices( function (error, devices ) {
            if ( error ) {
                log.info('getDevices failed error: ', error);
                _d.reject(error);
            } else {
                d.audioInputDevices = devices.filter(function (element) {
                    return element.kind == 'audioInput';
                });
                d.videoInputDevices = devices.filter(function (element) {
                    return element.kind == 'videoInput';
                });

                for ( var i = 0; i < d.audioInputDevices.length; i++ ) {
                    log.info('audio input device: ', d.audioInputDevices[i].deviceId);
                }
                for ( i = 0; i < d.videoInputDevices.length; i++ ) {
                    log.info('video input device: ', d.videoInputDevices[i].deviceId);
                }
                _d.resolve(d);
            }
        });

        return _d.promise();
    }


    function ot_initpub () {
        var _d = $.Deferred();
        var div = avc.pubc();
        var opt = getPublishOpt();
        publisher = OT.initPublisher(div, opt, function (error) {
            if ( error ) {
                oninitPublishFail(error);
                _d.reject('initPublisher failed with: ',  error);
            } else {
                oninitPublishOk();
                if ( opt.resolution ) {
                    setcurrentRes(opt.resolution);
                }
                _d.resolve(conftype());
            }
        });

        return _d.promise();
    }


    function oninitPublishOk() {
        log.info('Publisher initialized.');
        pub_handlers();
    }


    function oninitPublishFail (err) {
        if ( err.code === 1500 && err.message.indexOf('Publisher Access Denied:') >= 0 ) {
            showMessage('Please allow access to the Camera and Microphone and try publishing again.');
        } else {
            showMessage('Failed to get access to your camera or microphone. Please check that your webcam is connected and not being used by another application and try again.');
        }
        publisher.destroy();
        publisher = null;
    }


    function getPublishOpt () {
        var options = {};
        options.width = '100%';
        options.height = '100%';
        options.insertMode = 'append';
        options.style = {};
        options.style.nameDisplayMode = 'off';
        options.style.buttonDisplayMode = 'off';

        if ( conftype() == 'audiovideo' ) {
            options.publishAudio = true;
            options.publishVideo = true;
            options.resolution = getvideores();
            log.info('getPublishOpt video res: ' + options.resolution);
        } else {
            options.videoSource = null;
        }
        return options;
    }


    function pub_handlers () {
        publisher.on('accessAllowed', function (ev) {
            log.info('The user has granted access to the camera and mic');
        });

        publisher.on('accessDenied', function (ev) {
            log.info('user has denied access to the camera and mic. Please allow access to the camera and microphone and try publishing again');
        });

        publisher.on('accessDialogOpened', function (ev) {
            log.info('The allow/deny dialog box is opened.');
        });

        publisher.on('accessDialogClosed', function (ev) {
            log.info('The allow/deny dialog box is closed.');
        });

        publisher.on('destroyed', function (ev) {
            log.info('publisher destroyed event. Reason: ' + ev.reason);
        });

        publisher.on('mediaStopped', function (ev) {
            log.info('mediastopped event. User stopped screenshare.');
            screenshare.onstop();
        });

        publisher.on('streamCreated', function (ev) {
            log.info('streamCreated event. The publisher started streaming.');
            if ( ev.stream.hasVideo ) {
                avc.layout();
                log.info('publisher.element.id', publisher.element.id);
                $('#' + publisher.element.id).find('video').bind('contextmenu', function() {
                    return false;
                });
            }
        });

        publisher.on('streamDestroyed', function (ev) {
            /*
             *   ev.reason values :
             *  'clientDisconnected',
             *  'forceDisconnected',
             *  'forceUnpublished',
             *  'networkDisconnected',
             *  'mediaStopped'
             *  For details, see StreamEvent
             */
            if ( ev.reason === 'mediaStopped' ) {
                log.info('streamDestroyed mediaStopped event. User clicked stop sharing');
                screenshare.onstop();
            } else if ( ev.reason === 'forceUnpublished' ) {
                log.info('streamDestroyed forceUnpublished ev. moderator forced the user to stop sharing.');
            } else if ( ev.reason === 'networkDisconnected' ) {
                showMessage('Your publisher lost its connection. Please check your internet connection and try publishing again.');
            } else {
                log.info('The publisher stopped streaming. Reason: ' + ev.reason);
            }

            if ( ev.stream && ev.stream.hasVideo ) {
                avc.layout();
            }
        });
    }


    function start_publish () {
        log.info('start_publish called.');
        var _d = $.Deferred();
        _ses.publish(publisher, function (err) {
            if ( err ) {
                if ( err.code === 1553 || (err.code === 1500 && err.message.indexOf('Publisher PeerConnection Error:') >= 0) ) {
                    showMessage('Streaming connection failed. This could be due to a restrictive firewall.');
                } else {
                    showMessage('An unknown error occurred while trying to publish your video. Please try again later.');
                }
                publisher.destroy();
                publisher = null;
                log.error(err);
                _d.reject(err);
            } else {
                log.info('publishing stream success.');
                _d.resolve();
            }
        });
        return _d.promise();
    }


    function muteLocalAudio() {
        log.info('muteLocalAudio');
        if ( publisher ) {
            publisher.publishAudio(false);
        }
    }


    function unmuteLocalAudio() {
        log.info('unmuteLocalAudio');
        if ( publisher ) {
            publisher.publishAudio(true);
        }
    }


    function muteLocalVideo() {
        log.info('muteLocalVideo');
        if ( publisher ) {
            publisher.publishVideo(false);
        }
    }


    function unmuteLocalVideo() {
        log.info('unmuteLocalVideo');
        if ( publisher ) {
            publisher.publishVideo(true);
        }
    }


    function getSub (id) {
        for ( var i = 0; i < _subs.length; i++ ) {
            if ( id === _subs[i].element.id ) {
                return _subs[i];
            }
        }
        return null;
    }


    function muteRemoteVideo (id) {
        var sub = getSub(id);
        if ( sub ) {
            log.info('muteRemoteVideo subs found');
            sub.vmute = true;
            sub.subscribeToVideo('false'); // TODO video on off
        }
    }


    function unmuteRemoteVideo (id) {

    }


    function muteRemoteAudio (id) {

    }


    function unmuteRemoteAudio (id) {

    }


    function screenShareStart() {
        screenshare.start(_ses);
    }


    /* TODO: helpers in a file */
    function conftype () {
        return config.getConfType();
    }


    function getvideores () {
        if ( res_new ) {
            return otres(res_new);
        }
        return otres(config.getVideoRes());
    }


    function getdefaultvideores () {
        return otres(config.getVideoRes());
    }


    function setcurrentRes (res) {
        res_cur = res;
    }


    function otres (res) {
        if ( res === 'hd' ) {
            return videores.ot.hd;
        }
        if ( res === 'vga' ) {
            return videores.ot.vga;
        }
        if ( res === 'qvga' ) {
            return videores.ot.qvga;
        }
    }


    function ispublisher () {
        return config.isPublisher();
    }


    /*
     * arg val : true or false
     * call whenever a user is allowed to publish.
     * mutable : yes. changes config value
     */
    function setpublisher (val) {
        config.setPublisher(val);
    }


    function ses_connect (t) {
        var _d = $.Deferred();
        _ses.connect (t, function (err) {
            if ( err ) {
                onConnectFail(err);
                _d.reject('av session connect failed with ' + err.code);
            } else {
                log.info('You are connected to the av session.');
                _d.resolve();
            }
        });

        return _d.promise();
    }


    function onConnectFail (err) {
        log.error('Failed to connect.');
        if ( err.code === 1006 ) {
            log.error('Failed to connect. Please check your connection and try connecting again.');
        } else if ( err.code === 1004 ) {
            log.error('Failed to connect. Authentication error. Token expired. Try connecting again');
        } else {
            log.error('An unknown error occurred connecting. Please try again later. err.code: ' + err.code);
        }
    }


    function ses_handlers () {
        _ses.on({
            connectionCreated : function (ev) {
                numusers++;
                if ( ev.connection.connectionId !== _ses.connection.connectionId ) {
                    log.info('session connectionCreated event. Another client connected. ' + numusers + ' total.');
                }
            },

        connectionDestroyed : function connectionDestroyedHandler (ev) {
            numusers--;
            log.info('session connectionDestroyed event. A client disconnected. ' + numusers + ' total.');
        },

        sessionConnected : function (ev) {
            log.info('session sessionConnected event');
        },

        sessionDisconnected : function sessionDisconnectHandler (ev) {
            log.info('session sessionDisconnected event');
            /* The ev is defined by the SessionDisconnectEvent class */
            if ( ev.reason === 'networkDisconnected' ) {
                /* TODO take action */
                showMessage('Internet connection is probably lost. Please check your connection and try connecting again.');
            }
            avc.disconnected();
        },

        streamCreated : function (ev) {
            log.info('session streamCreated event');
            onRemoteStream(ev);
        },

        streamDestroyed : function (ev) {
            if ( ev.stream.hasVideo ) {

                log.info('session streamDestroyed event. has video');
				if ( ev.stream.videoType === 'screen' ) {
					screenshare.destroyScreenshare ();
				}

            } else {
                log.info('session streamDestroyed event');
            }
            /* TODO remove subscriber record */
            //delete _subs[ev.stream.name];
        },

        streamPropertyChanged : function (ev) {
            log.info('session streamPropertyChanged event');
        },

        });

        /*
         * subscriber.subscribeToAudio(true/false); // audio on off
         * subscriber.subscribeToVideo(true/false); // video on off
         * Volume control - subscriber.setAudioVolume(0); (silent. also via UI controls for sub)
         */
    }


    function onRemoteStream (ev) {
        if ( ev.stream.hasVideo ) {
            log.info('session streamCreated event. Has Video');
        }

        var div;

        if ( ev.stream.videoType === 'screen' ) {
            log.info('screenshare stream rxd');
            div = screenshare.div();
        } else {
            log.info('media stream rxd');
            div = avc.subc();
        }

        var sub = _ses.subscribe(
                ev.stream,
                div,
                getSubscriberOpt(),
                function (err) {
                    if ( err ) {
                        log.error('session subscribe failed: ', err.message);
                    } else {
                        onSubscribe(sub, ev);
                    }
                });
    }


    function getSubscriberOpt() {
        var options = {};
        options.style = {};
        options.style.nameDisplayMode = 'off';
        options.insertMode = 'append';
        options.width = '100%';
        options.height = '100%';
        return options;
    }


    function onSubscribe (sub, ev) {
        log.info('Subscribed to stream: ' + ev.stream.id);
        sub.element.setAttribute('id', 'RS_' + ev.stream.id);

        if ( ev.stream.videoType === 'screen' ) {
            screenshare.onRemoteStream(sub);
        } else {
            avc.svcstyle(sub);
        }

        _subs.push(sub);
        //_subs[ev.stream.name] = sub;
        sub_handlers(sub);

        log.info('incoming stream streamid: ' + ev.stream.streamId);
        log.info('incoming stream connectionid: ' + ev.stream.connection.connectionId);

        avc.layout();
    }


    function sub_handlers (sub) {
        sub.on('videoDisabled', function (ev) {
            log.info('videoDisabled event on id : ' + sub.id);
            log.info('videoDisabled event reason : ' + ev.reason);
        });

        sub.on('videoEnabled', function (ev) {
            log.info('videoEnabled event on id : ' + sub.id);
            log.info('videoEnabled event reason : ' + ev.reason);
            avc.layout();
        });

        sub.on('destroyed', function (ev) {
            log.info('DOM destroy reason : ' + ev.reason);
            avc.layout();
        });

        sub.on('videoDimensionsChanged', function (ev) {
            log.info('sub videoDimensionsChanged ev rxd');
            if ( sub.stream.videoType === 'screen' ) {
                log.info('screenshare size change detected');
                /*
                sub.element.style.width = event.newValue.width + 'px';
                sub.element.style.height = event.newValue.height + 'px';
                */
            } else {
                log.info('subscriber device rotation ev');
            }
        });
    }


    function showMessage (m) {
        log.info(m);
        /* TODO raise an event or show connection status */
        avc.showMessage(m);
    }


    function send_audio_mute () {
        f_handle.send_command ('*', 'audio.mute', 'on')
            .then (s, f);

        function s (data) {
            log.info ('send_audio_must: on: ok', data);
        }

        function f (err) {
            log.error ('send_audio_must: on: err: ' + err);
        }
    }


    return ot;

});
