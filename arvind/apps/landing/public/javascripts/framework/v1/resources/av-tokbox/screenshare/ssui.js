/* screenshare ui stuff */
define(function(require) {
    var $ = require('jquery');
    var remodal = require('remodal');
    var log = require('log')('ssui', 'info');

    var ssui = {};

    var display_spec = {};
    var handle = {};
    var cbs = {};

    var init;
    var screenShareDiv;
    var remodalinst;

    ssui.init = function (_display_spec, _handle, _cbs) {
        var _d = $.Deferred();
		var anchor = _display_spec.anchor;

        display_spec = _display_spec;
        handle = _handle;
        cbs = _cbs;

        screenShareDiv = $('body').find('#widget-screenshare')[0];

        registerHandlers();
        init = true;

        _d.resolve();

        return _d.promise();
    };


	ssui.getScreenShareDiv = function () {
		return screenShareDiv;
	};


	ssui.setScreenShareDiv = function (sub) {
        sub.element.style.setProperty('z-index', '100');
		$(screenShareDiv).addClass('active');
	};

	ssui.destroyScreenshare = function () {
		$(screenShareDiv).removeClass('active');
	};


	ssui.showss = function () {
        if ( init ) {
            $('#screenshare').show();
        }
    };


    ssui.hidess = function () {
        $('#screenshare').hide();
    };


    ssui.openSSModal = function (href) {
        var options = {
            closeOnConfirm : false
        };
        remodalinst = $('[data-remodal-id=modal]').remodal(options);
        $("a[href='chromeSSExtPath']").attr('href', href);
        remodalinst.open();
    };


    ssui.closeSSModal = function() {
        remodalinst.close();
    };


    function onDownload() {
        remodalinst.close();
    }


    function registerHandlers() {
        $('#screenshare').on('click', screenShare);
        $('#widget-nav li#nav-screenshare a').on('click', screenShare);
        $('.remodal-confirm').click(onDownload);
    }


    function screenShare() {
        log.info('screenShare click.');
        if ( cbs ) {
            cbs.screenShare();
        }
    }


    return ssui;
});
