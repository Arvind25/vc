var av_events = {
    r_created     : 'av.room_created',
    r_deleted     : 'av.room_deleted',
    s_started     : 'av.session_started',
    s_ended       : 'av.session_ended',
    s_shutdown    : 'av.session_shutdown',
    server_down   : 'av.server_down',
    streams_mod   : 'av.changed_streams',
    msg_rx        : 'av.message_received',
    user_removed  : 'av.user_removed',
    remote_stats  : 'av.remote_stats',
    u_joined      : 'av.user_joined',
    u_role_changed: 'av.user_role_changed',
    u_left        : 'av.user_left',
    u_destroyed   : 'av.user_destroyed',
    u_p_status    : 'av.presence_status',
    u_dev_av      : 'av.device_available'
};

module.exports = av_events;
