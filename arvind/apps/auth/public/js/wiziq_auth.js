$('#submit').click(function() {
	var formData = {
		"UserName"     : $('#userName').val(),
		"Password"     : $('#password').val(),
		"ResponseType" : "json"
	};

	$.ajax({
		url: "https://api.wiziq.com/glmobileapp/restservice?method=authenticate",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(formData),
		contentType: "application/json",
		cache: false,
		complete: function() {
			/* called when complete */
			console.log('process complete');
		},

		success: function(data) {
			console.log(data);
			alert('Successfully fetched data from wiziq_database');
		},

		error: function() {
			console.log('process error');
		},
	});
});



