define(function(require){

	var $ = require('jquery');
	var player = require('./player');
	var f_handle;
	var cont= {};
	var viewer;
	var zoomVal;
	var file;
	var data;
	var contentUrl; 
	var S3_CONTENT_STORAGE = 'https://boxcontent.s3.amazonaws.com/';
	cont.init = function(handle)
	{
		f_handle = handle;
		/****/

		$("#btnPrv").click(function(){
			var data = {
				action: 'prvclick',
				page: player.get_current_page()
			};
			send_info(data);
			player.scrollto('previous',(player.get_current_page() - 1));
		});

		/****/
		$("#btnNxt").click(function(){
			var data = {
				action: 'nextclick',
				page: player.get_current_page()
			};
			send_info(data);
			player.scrollto('next',(player.get_current_page()+1));	
		});

		/****/
		$("#btnZoomIn").click(function(){
			player.zoom('zoomin');
			var data = {
				action: 'zoomin',
				zoomval: zoomVal
			};
			send_info(data);
		});

		/****/
		$("#btnZoomOut").click(function(){
			player.zoom('zoomout');
			var data = {
				action: 'zoomout',
				zoomval:zoomVal
			};
			send_info(data);	
		});

		/****/
		$("#btnFitWidth").click(function(){
			player.zoom('zoomwidth');
			var data = {
				action: 'zoomfitwidth',
				zoomval: zoomVal
			};
			send_info(data);
		});

		/******/
		$("#viewChange").click(function(){
			var data;
			console.log('ViewChange: ',$("#viewChange").text());
			if($("#viewChange").text() == 'V View'){
				data = {
					action: 'viewchange',
					view:'vertical'
				};
				send_info(data);
				player.change_view('vertical',$('#pageInput').val());
				$("#viewChange").text("H View");
			}else{
				data = {
					action: 'viewchange',
					view:	'horizontal'

				};
				send_info(data);
				player.change_view('horizontal',$('#pageInput').val());
				$("#viewChange").text("V View");
			}
		});

		/*******/
		$('#pageInput').keypress(function(e){
			if(e.keyCode == 13 && $('#pageInput').val() !== ""){	
				var data = {
					action: 'loadpage',
					page:$('#pageInput').val()
				};
				player.scrollto('loadpage',$('#pageInput').val());
				send_info(data);
			}
			e.stopPropagation();
			e.stopped = true;
		});

		/****/
		$("#fileUpload").change(function(){
			file = this.files[0];
			// This code is only for demo ...
			console.log("name : " + file.name);
			console.log("size : " + file.size);
			console.log("type : " + file.type);
			console.log("date : " + file.lastModified);
		});

		/****/
		$("#btnUpload").click(function(){
			console.log('Upload button click handler.');
		});

		$('#playerInput').keypress(function(e){
			console.log('Player Input logs: ', e.keyCode);
			if(e.keyCode == 13 && $('#playerInput').val() !== ""){
				//player.init($('#playerInput').val());		 
				$.when(player.init($('#playerInput').val())).then(
					player_ready_event
				);	
			}
			e.stopPropagation();
			e.stopped = true;
		});

	};
	/* Method used to brodcast message to other users */
	function send_info(data){
		f_handle.send_info (null, 'content', data);	
	}
	/* Method used to load player*/
	cont.load_player = function (info){
		console.log('Load player after conversion success: ',info.content_id);
		if(info.urls !== undefined){ 
			contentUrl = info.urls.assets;
		}else{
			contentUrl = S3_CONTENT_STORAGE+info.content_id;
		}
		$.when(player.init(contentUrl)).then(
			player_ready_event
		);
	};
	/* Method called on player ready*/
	function player_ready_event(data){
		$('#pageInput').val(data.current_page);
		$('#totalPages').text('/'+data.total_pages);
		$("#contentHolder .crocodoc-viewport").scroll(function(evt){

		});
		window.addEventListener("mousewheel", mouse_wheel_handler, false);
	}
	/* Mouse wheel event*/	
	function mouse_wheel_handler(evt){

		var content_viewport = $('#contentHolder .crocodoc-viewport')[0];
		var vscroll = (content_viewport.scrollTop +evt.deltaY)/content_viewport.scrollHeight;
		var data = {
			action: 'scrollchange',
			pos:    vscroll
		};      
		send_info(data);
		console.log(' Heig: ',content_viewport.scrollHeight,' Top: ',content_viewport.scrollTop);
	}
	/** 	Method perform action on  broadcast information from server  **/
	cont.info = function ( id, data) 
	{	
		console.log('Broadcast response Content :'+ data.action );
		if(data.action === 'loadplayer'){
			//player.init(data.content_url);
		}else if(data.action === 'scrollchange'){
			var content_viewport = $('#contentHolder .crocodoc-viewport')[0];
			content_viewport.scrollTop = (data.pos * content_viewport.scrollHeight);
			console.log('Scroll at recciver: ', content_viewport.scrollTop );
		}else{
			player.info(id,data);
		}
	};
	return cont;
});
