define(function(require) {
	var $         = require('jquery');
	//var remodal   = require('remodal');
	var log       = require('log')('notify', 'info');

	var notify     = {};
	var modal_handle;
	var confirm_handler = null;

	/*
	 * Options:
	 *     level: info | warning | danger
	 *     opts = {
	 *         non_dismissable : true | false
	 *         buttons : {Cancel | Confirm | Reload
	 *                     'cancel' : <handler> also called on dismiss
	 *                     'confirm' : <handler>
	 *                     'reload'  : --none needed, as this will reload the page
	 *     }
	 *     title: <string>
	 *     content: <html>
	 */
	notify.alert = function (title, message, level, opts) {

		return;

		var e = new Error('x');
		log.info (e.stack);
		log.info ('notify called');
		var modal = $('[data-remodal-id=modal]');
		var options = {};

		/* First disappear everything */
		confirm_handler = null;
		modal.find('button.remodal-cancel').css('display', 'none');
		modal.find('button.remodal-confirm').css('display', 'none');

		modal.find('h1').html(title ? title:'untitled');
		switch (level) {
			case 'info':
				break;

			case 'warning':
				modal.find('span.level').addClass('text-warning');
				modal.find('h1').addClass('text-warning');
				modal.find('span.level').addClass('fa');
				modal.find('span.level').addClass('fa-warning');
				break;

			case 'danger':
				modal.find('span.level').addClass('text-danger');
				modal.find('h1').addClass('text-danger');
				modal.find('span.level').addClass('fa');
				modal.find('span.level').addClass('fa-exclamation-circle');
				break;

			default:
				break;
		}
		modal.find('.remodal-content').empty();
		modal.find('.remodal-content').append(message);

		if (opts) {
			if (opts.non_dismissable) {
				modal.find('button.remodal-close').css('display', 'none');
				options = {
					closeOnEscape:false,
					closeOnOutsideClick:false
				};
			}

			if (opts.button.confirm)
				modal.find('button.remodal-confirm').css('display', 'inline-block');

			if (opts.button.cancel)
				modal.find('button.remodal-cancel').css('display', 'inline-block');

			if (opts.button.reload)
				modal.find('button.remodal-reload').css('display', 'inline-block');
		}

		modal_handle = modal.remodal(options);
		set_handlers (opts);
		modal_handle.open();
	};

	notify.destroy_alert = function () {
		modal_handle.destroy ();
	};

	function set_handlers (opts) {
		if (!opts)
			return;

		if (opts.button.confirm) {
			$(document).on('confirmation', '.remodal', function () {
				opts.confirm();
			});
		}

		if (opts.button.concel) {
			$(document).on('cancellation', '.remodal', function () {
				opts.cancel();
			});
		}

		$(document).on('reload', '.remodal', function () {
			modal_handle.destroy();
		});

		$(document).on('closed', '.remodal', function () {
			modal_handle.destroy();
		});
	}

	return notify;
});
