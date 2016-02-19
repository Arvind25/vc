define(function(require){
	var $ = require('jquery');

	var player = {};
	var viewer;
	var current_page;
	var zoomVal;
	//var contentUrl = "https://view-api.box.com/1/sessions/20bb8a0ea71b479d9418a7c7ed3c6eea/assets";
	player.init = function (contentUrl){
		var _d = $.Deferred();
		viewer = Crocodoc.createViewer($("#contentHolder"), {url: contentUrl});
		viewer.load();
		viewer.on('ready', function (ev){ 

			console.log('viewer is ready, and the document has ' + ev.data.numPages + ' pages and current page: '+ev.data.page);
			//viewer.setLayout(Crocodoc.LAYOUT_PRESENTATION);
			viewer.setLayout(Crocodoc.LAYOUT_VERTICAL_SINGLE_COLUMN);
			current_page = ev.data.page;
			var data = {
				current_page 	: current_page,
				total_pages	: ev.data.numPages
			};
			_d.resolve(data);
		});

		/****/
		viewer.on('resize', function(ev){
			console.log('Document width: ' + ev.data.width + ' heght: '+ev.data.height );
		});
		/****/
		viewer.on('zoom',function(ev){
			zoomVal = ev.data.zoom;
		});

		/****/
		viewer.on('pagefocus', function(evt){
			current_page = evt.data.page;
			$('#pageInput').val(current_page);
		});
		return _d.promise();
	};
	player.scrollto = function(action,pageNumber){
		if(action === 'next'){

			viewer.scrollTo(Crocodoc.SCROLL_NEXT);
		}else if(action === 'previous'){

			viewer.scrollTo(Crocodoc.SCROLL_PREVIOUS);
		}else{
			viewer.scrollTo(pageNumber);
		}

	};
	player.zoom = function (action){
		if(action === 'zoomin'){
			viewer.zoom(Crocodoc.ZOOM_IN);
		}
		else if(action === 'zoomout'){
			viewer.zoom(Crocodoc.ZOOM_OUT);
		}
		else{
			viewer.zoom(Crocodoc.ZOOM_FIT_WIDTH);
		}

	};
	player.change_view = function(action, pageNumber){
		viewer.scrollTo(pageNumber);
		if(action === 'vertical'){
			viewer.setLayout(Crocodoc.LAYOUT_VERTICAL_SINGLE_COLUMN);
		}else{
			viewer.setLayout(Crocodoc.LAYOUT_PRESENTATION);
		}
	};
	player.get_current_page = function (){

		return 	current_page;

	};
	player.info = function(id,data){

		switch(data.action){
			case "nextclick":
				viewer.scrollTo(data.page + 1);
				break;
			case "prvclick":
				viewer.scrollTo(data.page - 1);
				break;
			case "zoomin":
				viewer.zoom(Crocodoc.ZOOM_IN);
				break;
			case "zoomout":
				viewer.zoom(Crocodoc.ZOOM_OUT);
				break;
			case "zoomfitwidth":
				viewer.zoom(Crocodoc.ZOOM_FIT_WIDTH);
				break;
			case "loadpage":
				viewer.scrollTo(data.page);
				break;
			case "viewchange":
				if(data.view == 'vertical'){
					viewer.setLayout(Crocodoc.LAYOUT_VERTICAL_SINGLE_COLUMN);
					$("#viewChange").text("H View");
				}else{
					viewer.setLayout(Crocodoc.LAYOUT_PRESENTATION);
					$("#viewChange").text("V View");
				}
				break;
		}
	};

	return player;
});
