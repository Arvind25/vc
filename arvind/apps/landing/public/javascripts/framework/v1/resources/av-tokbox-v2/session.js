define(function(require) {
	var $           = require('jquery');
	var events      = require('events');
	var log         = require('log')('av-session', 'info');
	var local       = require('./local-media');
	var layout      = require('./layout');
	var tokbox      = require('./tokbox');

	var session = {};
	var sess_info_cached;
	var f_handle_cached;
	var handlers = {
		/* Session related */
		'sessionConnected'       : sessionConnected,
		'sessionDisconnected'    : sessionDisconnected,
		'sessionReconnecting'    : sessionReconnecting,
		'sessionReconnected'     : sessionReconnected,

		/* Connection related */
		'connectionCreated'      : connectionCreated,
		'connectionDestroyed'    : connectionDestroyed,
		'streamCreated'          : streamCreated,
		'streamDestroyed'        : streamDestroyed,

		/* Connection related */
		'streamPropertyChanged'  : streamPropertyChanged,
	};
	var conn_emitter = events.emitter('av:connection', 'av:session.js');

	session.init = function (display_spec, custom, perms) {
		tokbox.set_exception_handler (exception_handler);
		return null;
	};

	session.start = function (f_handle, sess_info) {
		var d = $.Deferred ();

		sess_info_cached = sess_info;
		f_handle_cached  = f_handle;

		/* Get a div for the local media. For now, let's get a primary div. Once 
		 * the permissions set in, this will depend on the role of the current
		 * user */
		var cont = layout.get_container ('video-primary');

		tokbox.init (sess_info)
			.then ( tokbox.set_handlers.bind(tokbox, handlers),          d.reject.bind(d) )
			.then ( tokbox.connect,                                      d.reject.bind(d) )
			.then ( local.init.bind(null, f_handle, cont, conn_emitter), d.reject.bind(d) )
			.then ( local.start,                                         d.reject.bind(d) )
			;

		return d.promise();
	};

	session.info = function (from, id, data) {
		log.info ('TODO : session.info called but not implemented');
	};

	var conn_map = {};
	var stream_map = {};

	function exception_handler (code, title, message) {
		f_handle_cached.notify.alert('AV Error (' + code + ') ' + title, message, 'danger', {
			non_dismissable : true,
			button : { }
		});
	}

	function sessionConnected (ev) {
		log.info ('TODO : sessionConnected:', ev);
	}
	function sessionDisconnected (ev) {

		f_handle_cached.notify.alert ('AV: Session Disconnected', ev.reason, 'danger', {
			non_dismissable : true,
			button : { }
		});
	}
	function sessionReconnecting (ev) {
		log.info ('TODO : sessionReconnected', ev);
	}
	function sessionReconnected (ev) {
		log.info ('TODO : sessionConnected', ev);
	}

	function connectionCreated (connection_id, data, local_) {

		var container;

		if (!conn_map[connection_id])
			conn_map[connection_id] = { streams : {} };

		if (!local_)
			local_ = false;

		conn_map[connection_id].local = local_;
		conn_map[connection_id].vc_id = data;

		conn_emitter.emit('incoming-connection', {
			connection_id : connection_id,
			vc_id         : data,
			local         : local_
		});

		if (conn_map[connection_id].pending) {

			/* 
			 * See description of the race condition below in "streamCreated"
			 */

			for (var stream_id in conn_map[connection_id].pending) {
				var stream = conn_map[connection_id].pending[stream_id];

				/* Delayed call to streamCreated */
				streamCreated (stream_id, stream);
			}

			delete conn_map[connection_id].pending;
		}
	}

	function connectionDestroyed (connection_id, reason) {

		if (!conn_map[connection_id]) {
			log.error ('connectionDestroyed: no mapping for connection id ' + connection_id + ' (reason = ' + reason + ')');
			return;
		}

		log.info ('connection destroyed: ' + connection_id + ', reason = ' + reason);

		for (var stream_id in conn_map[connection_id].streams) {
			var stream = conn_map[connection_id].streams[stream_id];
			streamDestroyed (stream_id, stream);
		}

		delete conn_map[connection_id];
	}

	function streamCreated (stream_id, stream) {
		/*
		 * A new remote stream has been created */
		var opts_override = {};
		var connection_id = stream.connection.connectionId;

		/* Handle the race condition where the streamCreated may be called
		 * before the connectionCreated callback */
		if (!conn_map[connection_id]) {
			log.info ('race-condition: "streamCreated" called before "connectionCreated". Handling it.');

			if (!conn_map[connection_id].pending)
				conn_map[connection_id] = { pending : {} };

			conn_map[connection_id].pending[stream_id] = stream;

			/* We'll be called again once the connectionCreated is fired (unless tokbox has 
			 * some bug). */
			return;
		}

		/* 
		 * This is the normal path. Decide the type of container needed and get it.
		 *
		 */
		var local = conn_map[connection_id].local;
		var type;

		switch (stream.videoType) {
			case 'screen': 
				type = local ? 'screenshare-local' : 'screenshare-remote';
				break;

			case 'camera':
				type = local ? 'video-primary' : 'video-secondary';
				break;

			default:
				log.error ('Unknown stream type "' + stream.videoType + '", conn_id: ' + connection_id + ', stream_id: ' + stream_id);
				type = 'video-secondary';
				break;
		}

		/*
		 * Generally used by the 'container' module to create a tooltip */
		var vc_id  = conn_map[connection_id].vc_id;
		var _identity  = f_handle_cached.attendees.get_identity(vc_id);
		var meta_info = {
			identity : _identity,
			stream_id : stream_id,
			has_video : stream.hasVideo,
			has_audio : stream.hasAudio,
		};

		/* Also inform the framework */
		f_handle_cached.attendees.set_meta ( vc_id, 'microphone', stream.hasAudio);
		f_handle_cached.attendees.set_meta ( vc_id, 'camera', stream.hasVideo);

		var container = layout.get_container (type, meta_info);
		if (!container) {
			/* We cannot show this video as we ran out of containers. Here
			 * we should switch to pure audio. TODO: implement this */
			f_handle_cached.notify.alert ('Internal TODO message', 'Ran out of containers ! Implement audio only containers.', 'danger',
										  {
											  non_dismissable: false,
											  button : {
												  cancel : function () {}
											  }
										  });
			return;
		}


		container.set_connection_id (connection_id);

		stream_map[stream_id] = {
			connection_id : connection_id,
		};

		conn_map[connection_id].streams[stream_id] = {
			stream : stream,
			container : container,
			timer : null
		};

		tokbox.subscribe (stream, container.div(), opts_override)
			.then(
				function (subscriber) {
					/* The video should automatically get shown in the container
					 * that we passed above */
					layout.reveal_video(container);

					conn_emitter.emit('incoming-media', {
						connection_id : connection_id,
						stream_id     : stream_id,
						stream        : stream
					});

					/* Start a periodic timer to collect stats for this subscriber */
					stream_map[stream_id].timer = setInterval (get_subscriber_stats.bind(null, subscriber, container), 1000);
				},
				function (err) {
					layout.show_error (container, err);
					conn_emitter.emit('incoming-media', {
						err           : err,
						connection_id : connection_id,
					});
				}
			);


	}

	function streamDestroyed (stream_id, reason) {

		if (!stream_map[stream_id])
			return;

		var connection_id = stream_map[stream_id].connection_id;
		var container = conn_map[connection_id].streams[stream_id].container;

		log.info ('stream destroyed: stream_id: ' + stream_id + ', reason = ' + reason);

		layout.giveup_container (container, reason);
		clearInterval(stream_map[stream_id].timer);

		delete conn_map[connection_id].streams[stream_id];
		delete stream_map[stream_id];
	}

	function streamPropertyChanged (stream_id, stream, property, _old, _new) {
		/*
		 * This gets called for local media as well as remote media. For local media,
		 * we dont' handle the streamCreated event here (it is handled within local-media.js),
		 * so our stream_map does not contain it's information. However, the connectionCreated
		 * handler is still called, so we do have its information in our conn_map. */
		var cont;
		var meta = {};
		var conn_id = stream.connection.connectionId;
		var _local = conn_map[conn_id].local;
		var vc_id  = conn_map[conn_id].vc_id;

		if (_local)
			cont = local.container();
		else
			cont = conn_map[conn_id].streams[stream_id].container;

		log.info ('stream property changed: ' + stream_id + ', property: ' + property + ', changed from (' + _old + ') --> (' + _new + ')');

		if (property === 'hasAudio') {
			f_handle_cached.attendees.set_meta ( vc_id, 'microphone', _new);
			meta.has_audio = _new;
		}

		if (property === 'hasVideo') {
			f_handle_cached.attendees.set_meta ( vc_id, 'camera', _new);
			meta.has_video = _new;
		}

		cont.set_meta (meta);
	}

	function get_subscriber_stats (subscriber, container) {
		subscriber.getStats (function (err, stats) {
			container.set_meta ({
				subscriber_err : err,
				subscriber_stats : stats
			});
		});
	}

	return session;

});
