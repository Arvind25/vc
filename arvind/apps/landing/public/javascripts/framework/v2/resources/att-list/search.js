define( function(require){
	var $		= require('jquery'),
		Listjs	= require('./list');

	var search 	 = {},
		userlist = {};

	search.init = function(){
		var options = {
			valueNames : ['displayName','email','att_id']
		};
		userlist = new Listjs('atl-wrapper', options);
		$('#atl-search input').attr("placeholder",'Search a name or an email');
	};

	search.add = function( user){
		userlist.add(user);
	};

	search.remove = function( att_id){
		userlist.remove('att_id', att_id);
	};
	return search;
});
