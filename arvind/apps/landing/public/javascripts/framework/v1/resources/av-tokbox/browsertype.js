define(function(require) {
    var log = require('log')('browsertype', 'info');

    var bt = {};
    var browser;

    bt.browsertype = function () {
        if (typeof window === 'undefined' || !window.navigator) {
            log.info('This does not appear to be a browser');
            browser = 'not a browser';
        } else if (navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
            log.info('This appears to be Firefox');
            browser = 'firefox';
        } else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
            log.info('This appears to be Chrome');
            browser = 'chrome';
        }
        return browser;
    };

    return bt;
});
