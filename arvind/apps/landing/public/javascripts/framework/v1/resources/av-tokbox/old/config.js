define(function(require) {

  var av_config = {
    maxvideo : 6,
    conftype :  'audiovideo',
    publish : true,
    videores : 'qvga',
    hdvideo : false,
    stats : false,
    /* av-controls. more like av-mute, remove(div would be updated.) */
    maxvideores : 'vga',
    videolayout : 'horizontal'
  };

  var user_config = {
    name : null,
    /* userid or auth token */
    id : null,
    role : 'moderator'
  };

  var ot = {
    name    : 'ot',
    enabled : true,
    port : 8080,
    //sighostname : '192.168.56.101'
    sighostname : '192.168.17.151'
  };

  var kur = {
    name    : 'kur',
    enabled : false,
    port : null,
    sighostname : null ,
    stun : null,
    turn : null
  };

  /* SS End */

  var config = {
    template : 'default',
    auth : {},
    session_server : {
      host : 'localhost',
      port : 3179,
      auth : {}
    },
    resources : [
    {
      name: 'youtube',
      display_spec: { widget: 'av' },
      perms: { },
      custom: { url: 'https://youtu.be/A18NJIybVlA' },
    },
    /* SS Begin */
    {
      name : 'av',
      display_spec : { widget: 'av' },
      perms : { },
      custom : { config : av_config, user : user_config, server : ot },
    },
    /* SS End */
    {
      name: 'notify-box',
      display_spec: { widget: 'notify' },
      perms: { }
    }
    ],
  };

return config;

});
