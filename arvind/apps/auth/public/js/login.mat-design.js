function is_cookie_enabled () {
	var cookieEnabled=(navigator.cookieEnabled)? true : false;

	//if not IE4+ nor NS6+
	if (typeof navigator.cookieEnabled=="undefined" && !cookieEnabled){ 
		document.cookie="testcookie";
		cookieEnabled=(document.cookie.indexOf("testcookie")!=-1)? true : false;
	}

	return cookieEnabled;
}

function get_cookie(name) {
	var value = "; " + document.cookie;
	var parts = value.split("; " + name + "=");
	if (parts.length == 2) return parts.pop().split(";").shift();
}

if (!is_cookie_enabled()) {
	$('#cookie-error').html('I need cookies to function properly. Enable cookies, go back and retry again.');
	$('#cookie-error').css('display', 'block');
	$('#main-title').css('display', 'none');
	$('input#user_id').prop('disabled', true);
	$('input#display_name').prop('disabled', true);
	$('button').prop('disabled', true);

	throw 'no cookies enabled';
}

var redirect_to = get_cookie('wiziq_origin');

if (!redirect_to) {
	$('#cookie-error').html('Can\'t seem to know where you came from. Enable your cookies, go back and try again');
	$('#cookie-error').css('display', 'block');
	$('#main-title').css('display', 'none');
	$('input#user_id').prop('disabled', true);
	$('input#display_name').prop('disabled', true);
	$('button').prop('disabled', true);

	throw 'no cookies enabled';
}

$('button').on('click', function () {

	var id = $('input#user_id').val();
	var display_name = $('input#display_name').val();

	if(id === "" || display_name === "") {
		alert("Enter both the fields");         
		return false;
	}

	var identity = {
		id : id,
		displayName : display_name
	};

	var id_string = JSON.stringify(identity);
	var id_uriencoded = encodeURIComponent(id_string);

	document.cookie = "wiziq_auth=" + id_uriencoded + "; max-age=7200; path=/";

	window.location = decodeURIComponent(redirect_to);

	return false;
});
