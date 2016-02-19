var extensionID = chrome.runtime.id;

var prefix = 'com.tokbox.screenSharing.' + extensionID;

var port = chrome.runtime.connect();

var response = function(method, payload) {
    var res = { payload: payload, from: 'extension' };
    res[prefix] = method;
    return res;
};

port.onMessage.addListener(function (message) {
    if(message && message.method === 'permissionDenied') {
        window.postMessage(response('permissionDenied', message.payload), '*');
    } else if (message && message.method === 'sourceId') {
        window.postMessage(response('sourceId', message.payload), '*');
    }
});

window.addEventListener('message', function (event) {

    if (event.source != window) {
        return;
    }

    if(!(event.data !== null && typeof event.data === 'object' && event.data[prefix] && event.data.payload !== null && typeof event.data.payload === 'object')) {
        return;
    }

    if(event.data.from !== 'jsapi') {
        return;
    }

    var method = event.data[prefix],
    payload = event.data.payload;

if(!payload.requestId) {
    console.warn('Message to screen sharing extesnion does not have a requestId for replies.');
    return;
}

if(method === 'isExtensionInstalled') {
    return window.postMessage(response('extensionLoaded', payload), '*');
}

if(method === 'getSourceId') {
    return port.postMessage({ method: 'getSourceId', payload: payload });
}
});

window.postMessage(response('extensionLoaded'), '*');
