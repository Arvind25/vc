define(function (require) {
	var $            = require('jquery');
	var log          = require('log')('av-screenshare', 'info');
	var layout       = require('./layout');
	var remodal      = require('remodal');
	var menu         = require('./menu');
	var tokbox       = require('./tokbox');

	var screenshare = {};
	var f_handle_cached;
	var custom_config_cached;
	var publisher;

	screenshare.init = function (f_handle, custom) {
		f_handle_cached = f_handle;
		custom_config_cached = custom;

		$('.remodal-confirm').click(close_modal);

		/* Screenshare menu handler */
		menu.screenshare.set_handler(start);

		return null;
	};

	function start () {
		var d = $.Deferred ();

		tokbox.registerScreenSharingExtension('chrome', custom_config_cached.chromeextensionid);

		check_capability()
			.then(
				function (extension_installed) {
					if (extension_installed) {
						return really_start (d);
					}

					/* 
					 * If the extension is not installed then
					 * prompt the user to install. */
					prompt_for_installation (d);
				},
				function (err) {
					f_handle_cached.notify.alert('Screenshare Error', err, 'danger', {
						non_dismissable : true,
						button : { }
					});
					d.reject(err);
				}
			);

		return d.promise ();
	}

	function check_capability () {
		var d = $.Deferred();

		tokbox.checkScreenSharingCapability (function (res) {

			if ( !res.supported || res.extensionRegistered === false ) {
				d.reject('screensharing not supported');
			} 
			else if ( res.extensionInstalled === false ) {
				d.resolve(false);
			} 
			else {
				d.resolve(true);
			}
		});

		return d.promise();
	}

	var my_container;
	function really_start (d) {
		var i_am = f_handle_cached.identity.vc_id;

		my_container = layout.get_container ('screenshare-local');
		if (!my_container) {
			f_handle_cached.notify.alert('Screenshare Error', 'Ran out of free containers', 'danger', {
				non_dismissable : false,
				button : { }
			});
			d.reject ('ran out of free containers !');
			return;
		}

		my_container.set_meta ({
			identity  : f_handle_cached.identity,
			has_video : true,
			has_audio : false
		});

		/* OT destroys the div upon mediastream destruction, so create a child under it,
		 * and pass */
		$(my_container.div()).append('<div id="av-ot-screenshare-wrap"></div>');
		var div = $('div#av-ot-screenshare-wrap');

		tokbox.init_publisher (i_am, null, div[0], { 
				videoSource : 'screen'
			}).then(
					function (na, _publisher) {
						publisher = _publisher;
						set_handlers();
						tokbox.publish (publisher);
						layout.reveal_video(my_container);
						return d.resolve();
					},
					function (err) {
						f_handle_cached.notify.alert('Screenshare Error', err, 'danger', {
							non_dismissable : false,
							button : { }
						});
						$(my_container.div()).find('div#av-ot-screenshare-wrap').remove();
						layout.giveup_container(my_container);
						my_container = null;
						log.error ('screenshare: failed to initialize publisher: ', err);
						return d.reject(err);
					}
			);
	}

	/*
	 * Handle the modal */
	var modal;
	function prompt_for_installation (d) {
		var href = 'https://chrome.google.com/webstore/detail/' + custom_config_cached.chromeextensionid;
		modal = $('[data-remodal-id=browser-extension-download]').remodal({ closeOnConfirm : false });

		$("a[href='chromeSSExtPath']").attr('href', href);
		modal.open();
	}

	function close_modal () {
		modal.close ();
	}

	function set_handlers () {
		tokbox.set_pub_handlers ({
			'accessAllowed'        : accessAllowed,
			'accessDenied'         : accessDenied,
			'accessDialogOpened'   : accessDialogOpened,
			'accessDialogClosed'   : accessDialogClosed,
			'destroyed'            : destroyed,
			'mediaStopped'         : mediaStopped,
			'streamCreated'        : streamCreated,
			'streamDestroyed'      : streamDestroyed,
		});
	}

	/*
	 * ___________ Handlers ____________
	 *
	 */

	function accessAllowed (ev) {
		/* All is well - do nothing */
	}
	function accessDenied (ev) {
		log.error ('it seems, access to local media was denied by the user. TODO: Show a modal error here.');
	}
	function accessDialogOpened (ev) {
		/* All is well - do nothing */
	}
	function accessDialogClosed (ev) {
		/* All is well - do nothing */
	}
	function destroyed (ev) {
		log.info ('publisher element destroyed: reason: ' + ev.reason);
	}
	function mediaStopped (ev) {
		/* All is well - do nothing */
	}
	function streamCreated (ev) {
		var stream = ev.stream;
		layout.reveal_video (my_container);
	}
	function streamDestroyed (ev) {
		log.info ('streamDestroyed: ev = ', ev);
		layout.giveup_container (my_container, ev.reason);
	}

	return screenshare;

});
