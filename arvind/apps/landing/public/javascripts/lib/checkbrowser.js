function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1);
	        if (c.indexOf(name) === 0) return c.substring(name.length,c.length);
	    }
    return null;
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function mark_ok (_class) {
	$('table#checklist tbody tr td.' + _class).html('yup');
}

function mark_not_ok (_class) {
	$('table#checklist tbody tr td.' + _class).html('nope');
}

var mandatory_count = 2;

if (DetectRTC.isWebRTCSupported) {
	mandatory_count--;
	mark_ok ('webrtc-support');
} else 
	mark_not_ok ('webrtc-support');

if (DetectRTC.isWebSocketsSupported) {
	mandatory_count--;
	mark_ok ('websocket-support');
} else 
	mark_not_ok ('websocket-support');

if (DetectRTC.isSctpDataChannelsSupported) {
	mark_ok ('sctp-data-channel-support');
} else 
	mark_not_ok ('sctp-data-channel-support');

if (DetectRTC.isRtpDataChannelsSupported) {
	mark_ok ('rtp-data-channel-support');
} else 
	mark_not_ok ('rtp-data-channel-support');

if (mandatory_count) {
	$('#message').html('Incompatible Browser. Please use Chrome or Firefox.');
} else {
	setCookie('wiziq_bc', 'done', 1);
	$('#message').html('Browser Compatible. Reloading ...');
	location.reload();
}

/*
 * Add this in once we figure out which is the last candidate.
 *
DetectRTC.DetectLocalIPAddress (function (arg) {
	$('table#ip-addresses tbody').append('<tr><td></td></tr>');
	$('table#ip-addresses tbody').find('tr td:last').html(arg);
});
 *
 */
