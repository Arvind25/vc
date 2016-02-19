var $ = require('jquery-deferred');
var OpenTok = require('opentok');

var av_tokbox = {};

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

    var log = handles.log;

    key = myinfo.custom.apikey;
    secret = myinfo.custom.apisecret;
    chromelocalextensionid = myinfo.custom.chromelocalextensionid;
    chromeextensionid = myinfo.custom.chromeextensionid;
    inlinechromeextinstall = myinfo.custom.inlinechromeextinstall;
    try {
        opentok = new OpenTok(key, secret);
    }
    catch ( e ) {
        log.error({ err: e }, 'init error (OpenTok)');
    }

    var opt = {};
    opt.mediaMode = ( myinfo.custom.p2p ) ? 'relayed' : 'routed';
    /*
     * create a room
     */
    opentok.createSession (opt , function(err, session) {
        if ( err ) {
            log.error({ err: err}, 'init error (createSession)');
            return _d.reject('opentok session creation failed');
        }

        _session = session;
        sessionid = session.sessionId;
		log.info ({ session : session }, 'init ok');
        key = key;
        secret = secret;
        init = true;

        return _d.resolve();
    });

    return _d.promise ();
};

av_tokbox.init_user = function (user, prev_info, log) {
    var _d = $.Deferred ();

	/*
	 * If we allocated something for this user the previous
	 * time, let's just reuse this */
	if (prev_info) {
		log.info ({ prev_info : prev_info }, 'reusing');
		_d.resolve(prev_info);
		return _d.promise();
	}

    createToken (user, log, function (err, res) {
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
function createToken (user, log, cb) {
    /*
     * SS We'd require the token when an authenticated user comes in anytime after class is scheduled.
     * This could be before a class starts.
     * Let's say one checks the cam and mic, token access is required for client side APIs.
     */
    if ( !sessionid ) {
        var err = 'av-tokbox: sessionid not defined. check if init api is successful';
        log.error ({ err: err }, 'createToken error');
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
		log.info ({ token : tokenid }, 'token created');
    } catch ( e ) {
        log.error({ err : e }, 'token generation error');
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
