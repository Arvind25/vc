define(function(require){
	var $                   = require('jquery');
	var content_store = {};
	var content_api = 'https://conversions.wiziq.com/agliveContentApi/contentmanager.ashx';//'https://ipad.wiziq.com/RestService.ashx';
	var data_obj = {
		cu : 'https://live.wiziq.com/aliveext/LoginToSession.aspx?SessionCode=%2fscq0p6yzODHArajnYx%2fZA%3d%3d'
	};
	content_store.init = function(){
		console.log(' Content store init ');
		var headers =  {
			'Content-Type':'application/xml'
		};
		$.ajax({
			type: "GET",
			url: 'https://vcpre.wiziq.authordm.com/agliveContentApi/contentmanager.ashx?method=contentlibrary&sc=210216&t=folder&a=357&u=WI',//content_api+"?method=contentlibrary&sc=7160640&t=folder&a=180&u=WI",
			dataType: 'xml',
			success: function(data){
				console.log('Content store success:-> ',data);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				alert('Content store error:-> ',XMLHttpRequest);
			}
		});
	};
	return content_store;
});
