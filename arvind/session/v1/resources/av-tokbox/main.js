var $ = require('jquery-deferred');
var OpenTok = require('opentok');

var av_tokbox = {};

var log;
var opentok;
var _session = {};
var sessionid = null;
var key;
var secret;
var init;
var chromelocalextensionid;
var chromeextensionid;
var inlinechromeextinstall;

av_tokbox.init = function (myinfo, common, handles) {
    var _d = $.Deferred ();

    log = handles.log;

    key = myinfo.custom.apikey;
    secret = myinfo.custom.apisecret;
    chromelocalextensionid = myinfo.custom.chromelocalextensionid;
    chromeextensionid = myinfo.custom.chromeextensionid;
    inlinechromeextinstall = myinfo.custom.inlinechromeextinstall;
    try {
        opentok = new OpenTok(key, secret);
    }
    catch ( e ) {
        log.error(e);
    }

    var opt = {};
    opt.mediaMode = ( myinfo.custom.p2p ) ? 'relayed' : 'routed';
    /*
     * create a room
     */
    opentok.createSession (opt , function(err, session) {
        if ( err ) {
            log.error('createSession API fail. err: ', err);
            return _d.reject('opentok session creation failed');
        }

        log.info ('av-tokbox: createSession ok');
        _session = session;
        sessionid = session.sessionId;
		log.info ('av-tokbox: session_id = ' + sessionid);
        key = key;
        secret = secret;
        init = true;

        return _d.resolve();
    });

    return _d.promise ();
};

av_tokbox.init_user = function (user) {
    var _d = $.Deferred ();

    createToken (user, function (err, res) {
        return ( err ) ? _d.reject (err) : _d.resolve (res);
    });

    return _d.promise ();
};

av_tokbox.session_info = function () {
    return 'hello';
};

/*
 * createToken.
 * @params required
 * role - user role could be one of the following: 'moderator', 'publisher', 'subscriber'
 * expireTime - token expire time.
 * data - Optional connection data, may comprise of userid, username, etc. 1000 bytes max
 * @return : classid, sessionid, token, apikey, username, authid
 */
function createToken (user, cb) {
    /*
     * SS We'd require the token when an authenticated user comes in anytime after class is scheduled.
     * This could be before a class starts.
     * Let's say one checks the cam and mic, token access is required for client side APIs.
     */
    if ( !sessionid ) {
        var err = 'av-tokbox: sessionid not defined. check if init api is successful';
        log.warn (err);
        return cb(err, null);
    }

    var p = {
        role : 'moderator',
        expireTime : getTokenExpiry(),
        data : user.vc_id
    };

    var tokenid;
    try {
        tokenid = opentok.generateToken(sessionid, p);
		log.info ('av-tokbox: token -->' + tokenid);
    } catch ( e ) {
        log.error(e);
        return cb(e, null);
    }

    var res = {
        sessionid : sessionid,
        token     : tokenid,
        key       : key,
        classid   : null,
        username  : user.vc_id,
        authid    : null,
        chromelocalextensionid : chromelocalextensionid,
        chromeextensionid : chromeextensionid,
        inlinechromeextinstall : inlinechromeextinstall
    };

    return cb(null, res);
}


var activeSessionTime = 48*60*60;
var getTokenExpiry = function getTokenExpiry() {
    return (new Date().getTime() / 1000) + activeSessionTime;
};


module.exports = av_tokbox;
