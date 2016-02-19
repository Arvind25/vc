define(['require', './../ot-wrap', './../browsertype', './ssui'], function(require) {

    var OT = require('./../ot-wrap');
    var bt = require('./../browsertype');
    var ssui = require('./ssui');
    var log = require('log')('ss', 'info');
    var $ = require('jquery');

    var ss = {};
    var ses;
    var pub;
    var _cextId;
    var ss_install = false;
    var inlinechromeextinstall;

    ss.init = function (info, local) {
        var _d = $.Deferred();
        if ( bt.browsertype() === 'chrome' ) {
            log.info('screenshare on chrome');
            if ( local ) {
                OT.registerScreenSharingExtension('chrome', info.chromeScLocalExtId);
            } else {
                OT.registerScreenSharingExtension('chrome', info.chromeScExtId);
                _cextId = info.chromeScExtId;
                inlinechromeextinstall = info.inlinechromeextinstall;
                if ( inlinechromeextinstall ) {
                    initChromeInlineInstall();
                }
            }
        }
        checkInstalled()
            .then (_d.resolve, _d.reject);

        return _d.promise();
    };


    ss.start = function (session) {
        var msg;
        ses = session;
        if ( bt.browsertype() === 'chrome' ) {
            if ( ss_install === false ) {
                installChromeSSExt();
            } else {
                canstart();
            }
        }
    };


    ss.onstop = function () {
        log.info('screensharing stopped event');
    };


    ss.div = function () {
        return ssui.getScreenShareDiv();
    };

    ss.destroyScreenshare = function () {
        return ssui.destroyScreenshare ();
    };


    ss.onRemoteStream = function (sub) {
        // set high zindex
		ssui.setScreenShareDiv(sub);
    };


    function checkInstalled() {
        var _d = $.Deferred();
        OT.checkScreenSharingCapability (function (res) {
            log.info('OT.checkScreenSharingCapability res: ' + JSON.stringify(res));
            if ( !res.supported || res.extensionRegistered === false ) {
                var msg = 'This browser does not support screen sharing. reject promise';
                log.error(msg);
                _d.reject(msg);
            } else if ( res.extensionInstalled === false ) {
                log.info('Screenshare extension not installed.');
                _d.resolve();
            } else {
                log.info('Screenshare extension installed.');
                ss_install = true;
                _d.resolve();
            }
        });
        return _d.promise();
    }


    function installChromeSSExt() {
        if ( inlinechromeextinstall ) {
            var url = getChromeWebStoreInstallUrl();
            log.info('inline chrome install is true. url: ', url);
            chrome.webstore.install (url, successCb, failureCb);
        } else {
            openSSModal();
        }
    }


    function initChromeInlineInstall () {
        var hrefstr = 'href=' + getChromeWebStoreInstallUrl();
        var link = '<link rel="chrome-webstore-item"' + hrefstr + '>';
        $('head').append(link);
    }


    function getChromeWebStoreInstallUrl () {
        return 'https://chrome.google.com/webstore/detail/' + _cextId;
    }


    function openSSModal () {
        ssui.openSSModal(getChromeWebStoreInstallUrl());
    }


    function successCb () {
        log.info('Screenshare extension installed successfully');
        canstart();
    }


    function failureCb (error) {
        var msg = 'chrome screenshare extension install failed. Error: ' + error;
        log.error(msg);
        // popup a modal asking user to download the extension.
        //alert(msg);
    }


    function canstart () {
        var options = {
            videoSource : 'screen',
            //frameRate : 7,
        };

        pub = OT.initPublisher(
                document.createElement('div'),
                options,
                function (er) {
                    if ( er ) {
                        alert('Something went wrong screenShare initPublisher: ' + er.message);
                        /*
                         *1550 — "Screen sharing is not supported."
                         1551 — "Screen sharing requires a type extension, but there is no extension registered for type."
                         1552 — "Screen sharing requires a type extension, but it is not installed."
                         */
                    } else {
                        publish();
                    }
                });
    }


    function publish() {
        ses.publish(
            pub,
            function(error) {
                if ( error ) {
                    alert('Something went wrong screenShare session.publish: ' + error.message);
                } else {
                    log.info('screenshare publish success.');
                }
            });
    }


    function checkNInstalled() {
        var callCount = 0;
        var tid = setInterval(function () {
            if (callCount < 30) {
                checkExtInstalled();
                callCount++;
            } else {
                clearInterval(tid);
                log.info('timedout ext installed not found !');
            }
            if ( ss_install ) {
                log.info('ext installed success !');
                clearInterval(tid);
                canstart();
            }
        }, 1000);
    }


    function checkExtInstalled() {
        var msg = {
            type: 'installed',
        };

        chrome.runtime.sendMessage(
                _cextId,
                msg,
                function(response) {
                    if ( response ) {
                        ss_install = true;
                        log.error('got message from ext background script');
                    }
                });
    }

    /*
    function regexthandler() {
        var prefix = 'com.tokbox.screenSharing.' + _cextId;
        window.addEventListener('message', function(event) {
            if ( event.source != window ) {
                log.error('regexthandler wrong ev source: ', event.source);
                return;
            }
            if ( event.data.from === 'extension' ) {
                log.error(' event: ' + event.data);
                var method = event.data[prefix];
                var payload = event.data.payload;
                if ( method === 'extensionLoaded' ) {
                    log.error('extensionLoaded event');
                }
            }
        }, false );
    }
    */

    return ss;
});
