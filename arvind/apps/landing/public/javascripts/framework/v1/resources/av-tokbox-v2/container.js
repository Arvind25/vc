define(function(require) {
	var $           = require('jquery');
	var log         = require('log')('av-container', 'info');

	/*------------------------------------------------------------
	 *
	 * Container life cycle:
	 *    initial +---+ connected 
	 *                     +
	 *                     |
	 *                     |--------+ error
	 *                     |
	 *                     +
	 *                  streaming
	 *
	 *-----------------------------------------------------------*/
	var states = [
		'initial',
		'connected',
		'streaming',
		'error',
	];

	var modes = [
		'shunya',
		'primary',
		'secondary',
		'screenshare',
		'full',
		'pip'
	];

	var types = [
		'video-primary',
		'video-secondary',
		'screenshare-local',
		'screenshare-remote',
	];

	function get_mode (mode) {
		return this.mode;
	}

	function set_mode (mode) {
		/*
		 * Type = 'primary' | 'secondary' | 'screenshare' */
		if (modes.indexOf(mode) == -1) {
			log.error ('set_mode: unrecognized container mode : ' + mode);
			return;
		}

		var div = $(this.div());

		for (var i = 0; i < modes.length; i++) {
			var _class = 'av-' + modes[i];

			if (mode == modes[i]) {
				if (!div.hasClass(_class))
					div.addClass(_class);
				continue;
			}

			if (div.hasClass(_class))
				div.removeClass(_class);
		}

		log.info ('set mode = ' + mode + ', for #' + this.id());
		this.mode = mode;
	}

	function in_mode (mode) {
		if (modes.indexOf(mode) == -1) {
			log.error ('in_mode: unrecognized container mode : ' + mode);
			return false;
		}

		return this.mode == mode;
	}

	function get_type () {
		return this.type;
	}

	function set_type (type) {
		if (types.indexOf(type) === -1) {
			log.error ('set_type: unknown type "' + type + '" for container #' + this.id());
			return;
		}

		this.type = type;
	}

	function set_connection_id (connection_id) {
		this.conn_id = connection_id;
	}

	function stream_destroyed (type, stream) {
		change_state.call(this, 'connected');
	}

	function giveup () {
		var div = $(this.div());
		var list = div.attr('class').split(/\s+/);

		/* Remove all classes except ...*/
		$.each(list, function(index, _class) {

			if (_class === 'av-container')
				return;
			if (_class === 'tooltip')
				return;

			div.removeClass(_class);
		});

		/* Add the initial classes */
		if (!div.hasClass('av-container'))
			div.addClass('av-container');
		if (!div.hasClass('av-shunya'))
			div.addClass('av-shunya');

		this.mode    = 'shunya';
		this.type    = null;
		this.state   = 'initial';
		this.conn_id = null;
		this.stream  = null;
		log.info ('gave up container ' + this.id());
	}

	function show_error (error) {
		$(this.div()).append('<span></span>');
		$(this.div()).addClass('av-error');
		var span = $(this.div()).find('span');
		span.addClass('av-error');

		this.state = 'error';

		/* TODO : Add a tooltip indicating the error string */
	}

	function reveal () {
		var div = $(this.div());

		if (div.hasClass('av-shunya'))
			div.removeClass('av-shunya');

		if (!div.hasClass('av-visible'))
			div.addClass('av-visible');
	}

	function conceal () {
		var div = $(this.div());

		if (div.hasClass('av-visible'))
			div.removeClass('av-visible');

		if (!div.hasClass('av-shunya'))
			div.addClass('av-shunya');
	}

	function _change_state (state) {
		var div = $(this.div());

		if (states.indexOf(state) == -1) {
			log.error ('change_state: unrecognized container state (' + state + ') requested');
			return false;
		}

		/* This should mark the container with one of the following classes:
		 *     + av-connected
		 *     + av-streaming
		 *     + av-error
		 */
		for (var i = 0; i < states.length; i++) {
			var _class = 'av-' + states[i];

			if (state != states[i]) {
				if (div.hasClass(_class))
					div.removeClass(_class);
				continue;
			}

			if (!div.hasClass(_class))
				div.addClass(_class);
		}

		this.state = state;
		return true;
	}

	function change_state (state) {
		var old_state = this.state;
		if (_change_state.call (this, state)) {
			if (state === 'connected' || state === 'streaming')
				reveal.call (this);
			else
				conceal.call (this);

			log.info ('[ #' + this.id() + ' ]changed state from "' + old_state + '" to "' + state + '"');
		}
	}

	function in_mode_primary () {
		var div = this.div();

		if ($(div).hasClass('av-primary'))
			return true;

		return false;
	}

	function reveal_actual_video () {
		change_state.call(this, 'streaming');
	}

	var q_size = 5;

	function percentage_rx (q, val) {
		var audio_loss, audio_rx;
		var video_loss, video_rx;
		var audio_bw = 0, video_bw = 0;
		var audio, video;

		q.push(val);
		if (q.length > q_size)
			q.splice(0, 1);

		if (!q.length)
			return {
				audio : '0%',
				audio_bw : '-',
				video : '0%',
				video_bw : '-',
			};

		var max_index = q.length - 1;

		var interval = q[max_index].timestamp - q[0].timestamp;

		if (q[0].audio && q[max_index].audio) {
			audio_loss = q[max_index].audio.packetsLost - q[0].audio.packetsLost;
			audio_rx   = q[max_index].audio.packetsReceived - q[0].audio.packetsReceived;
			if (audio_rx + audio_loss === 0)
				audio = 0;
			else
				audio = (audio_rx * 100/(audio_rx + audio_loss)).toFixed(1);

			audio_bw = (q[max_index].audio.bytesReceived - q[0].audio.bytesReceived) * 8 / interval;
		}
		else
			audio = '-';

		if (q[0].video && q[max_index].video) {
			video_loss = q[0].video.packetsLost - q[max_index].video.packetsLost;
			video_rx   = q[0].video.packetsReceived - q[max_index].video.packetsReceived;
			if (video_rx + video_loss === 0)
				video = 0;
			else
				video = (video_rx * 100/(video_rx + video_loss)).toFixed(1);

			video_bw = (q[max_index].video.bytesReceived - q[0].video.bytesReceived) * 8 / interval;
		}
		else
			video = '-';

		return {
			audio : audio,
			audio_bw : (interval ? audio_bw.toFixed(0) : '-'),
			video : video,
			video_bw : (interval ? video_bw.toFixed(0) : '-'),
		};
	}

	/*
	 * Sets information in the tooltip */
	function set_meta (meta_info) {
		if (!meta_info)
			return;

		var div = this.div_;
		var q   = this.q;
		var tooltip = $(div).find('.tooltip-content');

		if (meta_info.identity) {
			$(tooltip).find('span.name').html(meta_info.identity.displayName);
			$(tooltip).find('span.nickname').html(meta_info.identity.nickname);
			$(tooltip).find('span.vc_id').html(meta_info.identity.vc_id);
		}

		if ('has_video' in meta_info) {
			if (meta_info.has_video) {
				$(tooltip).find('svg#camera').css('display', 'inline-block');
				$(tooltip).find('svg#camera-slash').css('display', 'none');
			}
			else {
				$(tooltip).find('svg#camera').css('display', 'none');
				$(tooltip).find('svg#camera-slash').css('display', 'inline-block');
			}
		}

		if ('has_audio' in meta_info) {
			if (meta_info.has_audio) {
				$(tooltip).find('svg#microphone').css('display', 'inline-block');
				$(tooltip).find('svg#microphone-slash').css('display', 'none');
				$(div).find('.mic-indicator').removeClass('show-mute');
			}
			else {
				$(tooltip).find('svg#microphone').css('display', 'none');
				$(tooltip).find('svg#microphone-slash').css('display', 'inline-block');
				$(div).find('.mic-indicator').addClass('show-mute');
			}
		}

		if (meta_info.subscriber_stats) {
			var stats = meta_info.subscriber_stats;
			var delta_rx = percentage_rx (q, stats);

			/* Audio */
			$(tooltip).find('span.audio-loss').html(stats.audio ? stats.audio.packetsLost : '-');
			$(tooltip).find('span.audio-rx').html(stats.audio ? stats.audio.packetsReceived : '-');
			$(tooltip).find('span.audio-bw').html(delta_rx.audio_bw + ' Kbps');

			/* Video */
			$(tooltip).find('span.video-loss').html(stats.video ? stats.video.packetsLost : '-');
			$(tooltip).find('span.video-rx').html(stats.video ? stats.video.packetsReceived : '-');
			$(tooltip).find('span.video-bw').html(delta_rx.video_bw + ' Kbps');
		}
	}

	return function (div) {
		this.id_          = $(div).attr('id');
		this.div_         = div;
		this.mode         = 'shunya';
		this.type         = null;
		this.state        = 'initial';
		this.conn_id      = null;
		this.stream       = null;
		this.q            = [];

		this.div               = function () { return this.div_; };
		this.id                = function () { return this.id_; };
		this.set_type          = set_type;
		this.get_type          = get_type;
		this.set_mode          = set_mode;
		this.get_mode          = get_mode;
		this.in_mode           = in_mode;
		this.set_connection_id = set_connection_id;
		this.stream_destroyed  = stream_destroyed;
		this.giveup            = giveup;
		this.show_error        = show_error;
		this.change_state      = change_state;
		this.in_mode_primary   = in_mode_primary;
		this.reveal_video      = reveal_actual_video;
		this.set_meta          = set_meta;
	};
});
